# 01 — Arquitectura

> ## ⚠️ Estado real de implementación (2026-06-23)
>
> Este documento es el plan de arquitectura de Fase 0 (2026-06-09), escrito antes de que existiera código. Sigue vigente como descripción de las **capas y la regla de dependencia** (sección 2) y del **estilo monolito modular** (sección 1) — eso sí se construyó tal cual. **No es confiable** para lo demás:
>
> - **No hay módulos verticales con contratos/eventos de integración entre sí** (sección 3 y 6) — la organización real es por carpetas de feature dentro de cada capa (`Auth`, `Appointments`, `Catalog`, `Customers`, `Posts`, `SuperAdmin`...), sin el aislamiento estricto ni el catálogo de eventos descrito.
> - **No existe Outbox transaccional ni worker separado** (sección 6 y 7) — no hay notificaciones de ningún tipo (WhatsApp/email/push) que dependan de esto.
> - **No hay Billing, Notifications ni Audit como módulos** — no hay pagos/suscripciones implementados, y la auditoría es solo campos (`CreatedAt`/`UpdatedAt`/`IsDeleted`), no un módulo `AuditLog` transversal.
> - El frontend real es **React 19 + Vite**, no Angular (la topología de la sección 7 menciona "BarberOS.Frontend (estáticos Angular)").
>
> Ver el inventario real completo en [`docs/current-state.md`](current-state.md), la historia de cómo se llegó aquí en [`docs/project-evolution.md`](project-evolution.md), y el veredicto detallado de este documento en [`docs/documentation-audit.md`](documentation-audit.md).
>
> El contenido original de Fase 0 continúa abajo sin modificar, como registro de la intención y el razonamiento de diseño original.

## 1. Estilo arquitectónico: monolito modular

**Decisión:** un único desplegable (`BarberOS.API`) organizado internamente en módulos con fronteras estrictas, sobre Clean Architecture. Microservicios quedan **descartados** para esta etapa (ver [ADR-001](adr/ADR-001-monolito-modular.md)).

Justificación resumida:

- Un equipo pequeño y un solo VPS no amortizan el costo operativo de microservicios (red, observabilidad distribuida, despliegues coordinados, consistencia eventual).
- El monolito modular conserva la opción de extraer servicios después: los módulos se comunican solo por contratos e integration events, nunca por acceso directo a tablas de otro módulo.
- El primer candidato natural a extracción futura es el **worker de notificaciones/outbox**, que ya nace como proceso separado dentro del mismo compose.

## 2. Capas y regla de dependencia

```
        ┌─────────────────────────────────────────┐
        │              BarberOS.API               │  endpoints, middleware, auth,
        │   (composición / entrada HTTP)          │  versionado, ProblemDetails
        └───────────────────┬─────────────────────┘
                            │ depende de
        ┌───────────────────▼─────────────────────┐
        │          BarberOS.Application           │  casos de uso (commands/queries),
        │  (orquestación, validación, contratos)  │  interfaces de proveedores, DTOs
        └───────────────────┬─────────────────────┘
                            │ depende de
        ┌───────────────────▼─────────────────────┐
        │            BarberOS.Domain              │  entidades, value objects,
        │      (núcleo puro, sin dependencias)    │  domain events, invariantes
        └─────────────────────────────────────────┘
                            ▲
                            │ implementa contratos de Application/Domain
        ┌───────────────────┴─────────────────────┐
        │         BarberOS.Infrastructure         │  EF Core, PostgreSQL, outbox,
        │   (detalles: BD, proveedores externos)  │  WhatsApp, pagos, storage, email
        └─────────────────────────────────────────┘
```

Reglas no negociables:

1. `Domain` no referencia ningún otro proyecto ni paquete de infraestructura.
2. `Application` solo conoce `Domain` y define **interfaces** (puertos) que `Infrastructure` implementa.
3. `API` no contiene lógica de negocio: traduce HTTP ⇄ casos de uso.
4. `Infrastructure` nunca es referenciada por `Domain` ni `Application`; se conecta por inversión de dependencias en el arranque.
5. Ningún módulo consulta tablas de otro módulo: consume su contrato público o reacciona a sus eventos.

## 3. Módulos verticales (bounded contexts)

Dentro de cada capa, el código se organiza por módulo funcional, no por tipo técnico:

| Módulo | Responsabilidad | Agregados raíz |
|--------|-----------------|----------------|
| **Tenancy** | Barberías (tenants), sucursales, planes, límites de plan | `Barbershop`, `Branch`, `Plan` |
| **Identity** | Usuarios, roles por tenant, sesiones, refresh tokens, login history | `User`, `RefreshTokenFamily` |
| **Catalog** | Servicios, categorías, precios, duración | `Service` |
| **Scheduling** | Horarios de trabajo, bloqueos, vacaciones, festivos, disponibilidad | `WorkSchedule`, `ScheduleBlock` |
| **Booking** | Reservas: crear, cancelar, reagendar; historial; anti doble-reserva; penalizaciones por cancelación; política de no-show | `Appointment`, `PenaltyPolicy`, `PenaltyRecord`, `NoShowPolicy`, `NoShowRecord` |
| **CRM** | Clientes de cada barbería, historial, notas | `Customer` |
| **Notifications** | Plantillas, envíos, proveedores (WhatsApp/email/SMS), outbox | `NotificationMessage` |
| **Billing** | Suscripciones, pagos, intentos, facturas, reembolsos | `Subscription`, `Payment`, `Invoice` |
| **Metrics** | KPIs, agregaciones de lectura (solo queries) | — (read models) |
| **Audit** | AuditLog transversal, historiales | `AuditLog` |

## 4. CQRS-ready

- Cada caso de uso es un **command** (escritura) o **query** (lectura) con su handler. Un mediador in-process (MediatR o un dispatcher propio mínimo) desacopla API de Application.
- **Sin event sourcing** y sin bus externo en v1: CQRS aquí significa separación de modelos, no infraestructura duplicada.
- Las queries pueden saltarse el dominio y leer proyecciones directamente (Dapper/SQL crudo sobre vistas) cuando el rendimiento lo exija — empezando por el módulo Metrics.
- Pipeline de comportamiento transversal (orden): logging → validación (FluentValidation) → autorización → transacción → handler → despacho de domain events.

## 5. DDD-friendly

- Invariantes dentro del agregado: por ejemplo, `Appointment` valida su propia transición de estados (`Pending → Confirmed → Completed | Cancelled | NoShow`).
- Value objects para conceptos con reglas: `PhoneNumber` (E.164, default +57), `Money` (monto + moneda, COP inicial), `TimeRange`, `Email`.
- Los agregados se referencian entre sí **por Id**, nunca por navegación entre módulos.
- Lenguaje ubicuo en inglés en el código (`Appointment`, `Barber`, `Booking`), glosario español/inglés en [04-dominio-y-modulos](04-dominio-y-modulos.md).

## 6. Eventos: dominio vs integración

| | Domain Events | Integration Events |
|---|---|---|
| Alcance | Dentro del mismo proceso y transacción | Entre módulos / procesos / sistemas externos |
| Despacho | In-process al confirmar `SaveChanges` | **Outbox transaccional** + worker ([ADR-005](adr/ADR-005-outbox-eventos.md)) |
| Garantía | Atómico con la operación | At-least-once, consumidores idempotentes |
| Ejemplos | `AppointmentCreated` dispara creación de historial | `AppointmentCreated` → envío de WhatsApp de confirmación |

Catálogo inicial de eventos (diseño, no implementación):

- `AppointmentCreated`, `AppointmentConfirmed`, `AppointmentCancelled`, `AppointmentRescheduled`, `AppointmentCompleted`, `AppointmentNoShow`
- `PenaltyApplied`, `PenaltyConsumed`, `PenaltyWaived`, `PenaltyExpired`
- `NoShowRecorded`, `NoShowWaived`, `CustomerBookingBlocked`, `CustomerBookingUnblocked`
- `CustomerRegistered`
- `PaymentApproved`, `PaymentDeclined`, `RefundIssued`
- `SubscriptionActivated`, `SubscriptionRenewed`, `SubscriptionPastDue`, `SubscriptionExpired`, `SubscriptionCancelled`
- `TenantProvisioned`, `TenantSuspended`

Convención: eventos en pasado, payload mínimo (ids + datos inmutables del hecho), versionados (`v1` en el nombre del tipo persistido en outbox).

## 7. Procesos en ejecución (topología v1)

```
Internet ──► Nginx (TLS, reverse proxy, rate limit L7 básico)
               ├──► BarberOS.Frontend  (estáticos Angular)
               ├──► BarberOS.API       (ASP.NET Core)
               │        └──► PostgreSQL
               └──► (webhooks de pagos/WhatsApp → BarberOS.API)

BarberOS.Worker (mismo código base, perfil "worker"):
   outbox dispatcher · recordatorios programados · jobs de mantenimiento
```

El worker es el mismo ejecutable con un perfil distinto (hosted services activados por configuración). Esto evita un segundo proyecto pero permite escalarlo o extraerlo de forma independiente cuando haga falta.
