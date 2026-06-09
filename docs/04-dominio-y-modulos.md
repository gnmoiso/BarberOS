# 04 — Dominio, roles y módulos funcionales

## 1. Roles y matriz de permisos

Modelo: **roles por membresía de tenant** (`users_tenant_roles`) + rol de plataforma (`SuperAdmin`). Un mismo usuario puede ser Owner de una barbería, Barber en otra y cliente en diez.

| Capacidad | Cliente | Barbero | Admin Barbería (Owner/Admin) | SuperAdmin |
|---|:---:|:---:|:---:|:---:|
| Registrarse / gestionar su perfil | ✔ | ✔ | ✔ | ✔ |
| Reservar / cancelar / reagendar sus citas | ✔ | — | — | — |
| Consultar su historial | ✔ | — | — | — |
| Administrar su agenda y horarios | — | ✔ | ✔ | — |
| Administrar servicios y precios | — | ✔* | ✔ | — |
| Administrar clientes (CRM) | — | ✔ | ✔ | — |
| Administrar empleados/barberos | — | — | ✔ | — |
| Consultar métricas del tenant | — | ✔ (propias) | ✔ (todas) | — |
| Gestionar suscripción y pagos del tenant | — | — | ✔ (solo Owner) | — |
| Gestionar sucursales y branding | — | — | ✔ | — |
| Administrar tenants, planes, métricas globales | — | — | — | ✔ |

\* configurable por el Admin (flag `barbers_can_edit_services` en settings del tenant).

Autorización técnica: políticas de ASP.NET Core basadas en claims (`tenant_id`, `roles[]`, `platform_role`) + chequeo de **límites de plan** como pipeline behavior (p. ej. crear el barbero #2 en plan Inicio → `403 plan_limit_exceeded`).

## 2. Módulo Agenda (Scheduling)

- Horario semanal por barbero con vigencias (`valid_from/valid_to`): cambiar el horario no reescribe la historia.
- Bloqueos puntuales: vacaciones, citas personales, festivos (calendario de festivos de Colombia precargado por año, aplicable por sucursal), mantenimiento.
- **Cálculo de disponibilidad** (query pura, cacheable): slots = horario vigente − bloqueos − citas activas, discretizado según duración del servicio elegido y `slot_granularity` del tenant (default 15 min).
- Zona horaria: todos los cálculos en la TZ del tenant; almacenamiento en UTC.

## 3. Módulo Reservas (Booking)

Reglas de negocio:

1. **No doble reserva**: validación en Application + constraint de exclusión en BD (defensa doble; ver [03-modelo-datos](03-modelo-datos.md) §4).
2. La cita debe caber íntegramente en disponibilidad real al momento de confirmar.
3. Anticipación mínima/máxima configurables por tenant (default: ≥ 30 min, ≤ 60 días).
4. Cancelación por cliente permitida en cualquier momento, pero sujeta a la **política de penalización del tenant** (ver §3.1): cancelar fuera de la ventana gratuita y superado el cupo tolerado genera `PenaltyRecord`.
5. Reagendar = transición atómica (cancela + crea con vínculo `rescheduled_from_id`), nunca dos pasos sueltos.
6. Política de no-show: marcado manual por la barbería; contador por cliente visible en CRM.
7. **Idempotencia**: `Idempotency-Key` obligatoria en creación de reservas (reintentos de red móvil no duplican citas).
8. Estados: `Pending → Confirmed → Completed | Cancelled | NoShow`. Si el tenant activa auto-confirmación, nace en `Confirmed`.
9. Toda transición emite domain event + registro en `appointment_history`.
10. **Precios informativos**: BarberOS no cobra servicios; el precio registrado en la cita (base + penalización) es lo que el barbero cobrará en persona. No existe checkout de citas en ningún flujo.

### 3.1 Penalización por cancelación (submódulo Penalties — [ADR-009](adr/ADR-009-penalizaciones.md))

Configurable **por barbería** (nunca global), desde el panel del Admin:

| Parámetro | Significado | Default |
|-----------|-------------|---------|
| `is_enabled` | activar/desactivar la penalización por completo | off |
| `penalty_percentage` | recargo sobre la siguiente reserva (ej. A=25%, B=50%, C=100%) | 50% |
| `free_cancellation_window_hours` | cancelar con más antelación no penaliza | 24h |
| `max_free_cancellations` | cancelaciones tardías toleradas por período | 1 |
| `evaluation_period_days` | período móvil de conteo | 30 |
| `penalty_expiration_days` | caducidad de una penalización no consumida | sin caducidad |

Flujo: cancelación tardía de cita confirmada → `PenaltyRecord` activo (evento `PenaltyApplied`) → la siguiente reserva del cliente en esa barbería muestra el precio recargado **antes de confirmar** (corte $40.000 + 50% = $60.000 COP) y lo registra desglosado → al completarse la cita el record pasa a `Consumed`. El staff puede **perdonar** (`PenaltyWaiver` con motivo y auditoría, evento `PenaltyWaived`). Todo cambio queda en `penalty_history`. El cliente penalizado ve su estado en su perfil; la barbería ve sus clientes penalizados en el CRM.

## 4. Módulo Servicios (Catalog)

- CRUD por barbería: nombre, descripción, duración, precio, categoría, foto, orden.
- Catálogo semilla sugerido al provisionar tenant: Corte tradicional, Fade, Barba, Corte + Barba, Tinte, Cejas (editable/eliminable).
- Overrides por barbero (precio/duración) en planes Profesional+.
- Los servicios nunca se borran físicamente si tienen citas: soft delete + `is_active`.

## 5. Módulo Clientes (CRM)

- Ficha: nombre, teléfono, WhatsApp, correo, etiquetas, notas, historial de citas, contador de no-shows, total gastado.
- Origen dual: auto-creado al reservar online (vinculado a `user_id`) o creado manualmente por la barbería (walk-in, sin cuenta).
- Fusión de duplicados por teléfono (acción explícita del staff, auditada).
- Cumplimiento Ley 1581/2012 (habeas data): consentimiento registrado, derecho de supresión → anonimización (ver [05-seguridad](05-seguridad.md) §8).

## 6. Módulo WhatsApp y Notificaciones

Arquitectura desacoplada por contratos (diseño conceptual):

```
INotificationProvider          # contrato base: Send(message) → resultado normalizado
 ├─ IWhatsappProvider          # impl. v1: Meta WhatsApp Business Cloud API
 ├─ IEmailProvider             # impl. v1: Resend o SendGrid
 └─ ISmsProvider               # impl. futura: Twilio (fallback de WhatsApp)
```

- **Disparo por eventos**: los integration events (`AppointmentCreated`, `AppointmentCancelled`, …) generan `notification_messages` desde el worker de outbox. La API nunca llama a Meta de forma síncrona.
- Mensajes salientes: confirmación, recordatorio (24h y 2h antes — jobs programados del worker), cancelación, reprogramación.
- Plantillas pre-aprobadas por Meta (`notification_templates.provider_template_id`); el onboarding de WABA por tenant es un riesgo operativo gestionado (ver [13-riesgos](13-riesgos.md)).
- Webhooks de estado (delivered/read/failed) actualizan `notification_messages`.
- Reintentos con backoff exponencial + dead-letter (estado `Failed` tras N intentos, visible en panel).
- Multi-tenant: v1 usa el número WABA de la plataforma con plantillas que mencionan a la barbería; número propio por tenant queda como feature Premium futura.

## 7. Módulo Suscripciones y Planes

| Plan | Límites clave |
|------|---------------|
| Inicio | 1 barbero, 1 sucursal, agenda + reservas + WhatsApp básico |
| Profesional | 5 barberos, métricas, reportes, branding |
| Premium | sucursales múltiples, barberos ilimitados, automatizaciones, reportes avanzados |
| Enterprise | multi-sucursal, API pública, soporte prioritario, opción BD dedicada |

- Trial de 14 días (configurable) sin tarjeta.
- Ciclo: `Trialing → Active → PastDue (gracia 5 días, reintentos) → Suspended → Cancelled`.
- Suspensión = solo lectura para el tenant (no se borra nada); reactivación inmediata al pagar.
- Downgrade validado contra uso real (no se puede bajar a Inicio con 3 barberos activos).

## 8. Módulo Pagos (exclusivamente suscripción SaaS)

> **Regla de negocio**: BarberOS jamás procesa pagos de servicios de barbería. El cliente no paga dentro de la plataforma; el dinero del servicio es asunto exclusivo entre cliente y barbero. No existen checkout de citas, comisiones por servicio ni pasarela para cortes. Este módulo cobra una sola cosa: la **suscripción mensual** del dueño de la barbería.

- `IPaymentProvider` con modelo genérico: `CreateCheckout`, `GetPaymentStatus`, `Refund`, `VerifyWebhookSignature`.
- **Wompi** primario (PSE, Nequi, tarjetas — métodos que Colombia exige), **Mercado Pago** segundo, Stripe/PayPal listos por contrato ([ADR-007](adr/ADR-007-pagos-wompi.md)).
- Webhooks: firma verificada, procesamiento idempotente por `provider_event_id`, persistencia cruda en `payment_attempts.provider_response`.
- La verdad del estado de un pago es **siempre** el webhook/consulta al proveedor, nunca el redirect del navegador.

## 9. Módulo Métricas

KPIs definidos (queries de lectura sobre datos transaccionales; sin pipeline de BI en v1):

| KPI | Definición |
|-----|------------|
| Reservas por día/mes | count de `appointments` creadas por período |
| Tasa de cancelación | canceladas / total, por período |
| Tasa de no-show | no-shows / completadas+no-shows |
| Clientes recurrentes | clientes con ≥ 2 citas completadas en 90 días |
| Ingresos | suma de `total_price` de citas completadas |
| Ticket promedio | ingresos / citas completadas |
| Top servicios | ranking por count y por ingresos |
| Ocupación por barbero | minutos reservados / minutos disponibles del horario |
| Clientes penalizados | clientes con ≥ 1 `PenaltyRecord` activo o consumido en el período |
| Cancelaciones por cliente | ranking de clientes por cancelaciones tardías en el período |
| % de cancelación | citas canceladas / citas creadas, por período |
| Clientes reincidentes (cancelación) | clientes con ≥ 2 cancelaciones tardías en el período de evaluación |
| Ingresos potencialmente perdidos | suma de `base_price` de citas canceladas tardíamente no reagendadas |

Nota: "ingresos" en BarberOS son siempre **estimados sobre precios informativos** (la plataforma no procesa el dinero de los servicios).

SuperAdmin: MRR, churn de tenants, tenants activos, citas totales plataforma, salud de notificaciones.

## 10. Glosario (lenguaje ubicuo)

| Español (UI) | Inglés (código) |
|---|---|
| Barbería (tenant) | Barbershop / Tenant |
| Sucursal | Branch |
| Barbero | Barber |
| Cita / Reserva | Appointment |
| Servicio | Service |
| Cliente (de la barbería) | Customer |
| Usuario (de plataforma) | User |
| Bloqueo de agenda | ScheduleBlock |
| Plan / Suscripción | Plan / Subscription |
| Penalización | Penalty (Policy / Record / Waiver) |
