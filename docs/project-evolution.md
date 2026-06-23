# Evolución del proyecto

> Reconstruido a partir del historial de Git, los nombres de migraciones EF Core y el estado real del código — no es un changelog mantenido turno a turno desde el día uno, sino una reconstrucción honesta de cómo se llegó del plan de Fase 0 a lo que está en producción hoy (2026-06-23).

## Fase 0 — Arquitectura y planificación (2026-06-09)

Se escribió un conjunto extenso de documentos de diseño (`docs/00` a `docs/15`, más 12 ADRs) **antes de escribir una sola línea de código**. El README de entonces lo decía explícitamente: *"No existe código fuente todavía"*.

Decisiones tomadas en esa fase (algunas se mantuvieron, otras no — ver tabla):

| Decisión de Fase 0 | ¿Se mantuvo? |
|---|---|
| Monolito modular + Clean Architecture | **Sí** — la estructura de 4 proyectos (Domain/Application/Infrastructure/API) es la que existe hoy |
| Multi-tenant: BD única + `TenantId` + RLS | **Parcial** — BD única y `TenantId` sí; RLS de PostgreSQL nunca se implementó, solo filtros de aplicación (EF Core) |
| .NET 10 LTS | **Sí** — `Directory.Build.props` fija `net10.0` |
| Redis diferido | **Sí** (sigue diferido — de hecho nunca se necesitó) |
| Outbox transaccional para eventos | **No** — no existe outbox ni worker separado |
| Storage en Cloudflare R2 / MinIO en dev | **No** — los archivos van a disco local con volumen Docker |
| Pagos vía Wompi | **No** — no hay integración de pagos en absoluto |
| Penalización por cancelación configurable | **Sí** — implementado como porcentaje en `Customer`, más simple que el diseño original (`PenaltyPolicy`/`PenaltyRecord`/`History`/`Waiver` completo no se construyó tal cual, quedó en un campo de penalización directo) |
| URLs por slug público + panel único | **No** — no hay booking público; todo vive dentro del panel autenticado en rutas internas de SPA |
| Frontend: Angular 21 | **No — reemplazado por React** (ver más abajo) |
| JWT con RS256 | **No** — se implementó HS256 y nunca se migró |

## Fase 1 en adelante — lo que realmente se construyó

A diferencia del roadmap planeado (Fundación → Auth → Multi-tenant → Agenda → Reservas → Clientes → WhatsApp → Suscripciones...), el desarrollo real avanzó por **funcionalidad de producto de punta a punta** en vez de por capas horizontales. La evidencia en el código (migraciones EF Core, con fecha) muestra el orden real de construcción:

1. `InitialSchema` (19-jun) — esquema base: usuarios, tenants, roles, servicios, barberos, horarios, clientes, citas, licencias, políticas de penalización/no-show, configuración de barbería, códigos de invitación.
2. `AddRatingsAndPosts` (19-jun) — calificaciones y el módulo de Novedades (posts/comentarios/reacciones) se agregaron juntos, no en fases separadas.
3. `AddPenaltyPercentage`, `AddProfileAvatarPostAuthorAndReminderSettings`, `FixReminderMinutesDefault`, `AddWorkScheduleBreaks`, `AddPlatformLogoUrl`, `AddAppointmentAddOns`, `AddMinLeadMinutes`, `AddTenantLogoUrl`, `AddTestimonialApprovalWorkflow` (19–20 jun) — iteración rápida de ajustes de producto: avatares, branding por barbería y por plataforma, recordatorios, descansos en horarios, testimonios con flujo de aprobación.
4. `AddUniquePhoneIndex`, `AddLicenseSoftDeleteFilter` (23-jun) — endurecimiento de seguridad y de gestión de licencias, ya en producción.

Esto confirma que **no hubo una "Fase 1: Fundación" separada de 2 semanas** como planeaba `docs/14-fase1-plan.md` — el proyecto fue directo a construir funcionalidad de negocio completa sobre una base mínima viable, e iteró sobre producción real.

## Migración de frontend: Angular → React

El plan de Fase 0 (`docs/07-frontend.md`) especificaba Angular 21 con standalone components, signals y zoneless change detection. El frontend que realmente se construyó y está en producción es **React 19 + Vite + TailwindCSS v4**, sin ningún rastro de Angular en el repositorio actual (no hay `angular.json`, no hay `BarberOS.Frontend/`, la carpeta es simplemente `frontend/` con estructura de Vite).

No hay evidencia en el repositorio de cuándo ni por qué ocurrió este cambio exacto (el historial de Git anterior a esta auditoría no se conserva en detalle en este documento) — lo verificable es que **hoy no existe ningún código Angular**, y que la base de código React está completa, organizada y desplegada. Cualquier referencia a Angular en `docs/07-frontend.md` debe tratarse como histórica, no como estado actual.

## Cambios de infraestructura

- **VPS compartido**: BarberOS no tiene VPS propio — coexiste con otro proyecto (TitanPro) en el mismo servidor, compartiendo el contenedor Nginx. Esto no estaba en ningún plan de Fase 0 (que asumía infraestructura dedicada).
- **Bug de DNS entre proyectos**: al conectar el Nginx compartido a la red Docker de BarberOS, dos contenedores de proyectos distintos (`titanpro-api` y `barberos-api`) resultaron con el mismo alias Docker `api` en sus redes respectivas. Como Nginx estaba conectado a ambas redes, esto causaba que TitanPro recibiera respuestas de BarberOS en algunas rutas. Se corrigió usando siempre nombres de contenedor explícitos en los upstreams de Nginx, nunca alias genéricos.
- **Pérdida de uploads por falta de volumen**: las imágenes subidas (logos, fotos de posts) vivían solo en la capa escribible del contenedor del backend, sin volumen Docker. Al reconstruir la imagen para un despliegue, se perdieron todas las imágenes subidas hasta ese momento. Se corrigió agregando un volumen persistente — pero las imágenes anteriores al fix no se pudieron recuperar.
- **Rotación de secretos**: se detectó que tanto el password de PostgreSQL como el secreto JWT en producción tenían los valores placeholder literales de la plantilla (`CAMBIA_ESTA_CLAVE_...`), nunca reemplazados. Ambos se rotaron en producción.
- **Acceso a PostgreSQL para administración**: se habilitó acceso vía túnel SSH (nunca expuesto directamente a internet) para permitir administración con PgAdmin 4 u otra herramienta externa.

## Cambios de dominio (producto)

- **Verificación de clientes**: el plan original consideraba OTP por WhatsApp antes de la primera reserva. Lo implementado es más simple: códigos de invitación de 10 caracteres que cada barbería comparte manualmente con sus clientes, con una variante por QR que nunca expone el código en texto plano (usa un id opaco resuelto server-side).
- **Multi-tenant de clientes**: un mismo cliente puede vincularse a varias barberías (registro de `Customer` por tenant) y cambiar entre ellas o salir de una sin perder su cuenta de usuario global.
- **Moneda**: COP como default consistente en todo el sistema (el plan original lo definía así; se corrigió una inconsistencia donde un campo de configuración de barbería todavía defaulteaba a USD).
- **Branding**: tanto cada barbería como la plataforma BarberOS en su conjunto tienen logo configurable — el plan original dejaba el alcance de "branding personalizable" como observación abierta de Fase 0; en la práctica se resolvió con un logo por entidad, sin temas de color ni dominios personalizados.
- **Panel de plataforma (SuperAdmin)**: creció más allá de lo planeado en Fase 0 — incluye gestión global de clientes (no solo de barberías/licencias), eliminación de barberías/clientes/licencias con revocación de acceso inmediata, y gestión de la propia cuenta del SuperAdmin (contraseña y foto de perfil).

## Qué leer de la documentación histórica y qué no

Los documentos `docs/00` a `docs/15` y los 12 ADRs siguen siendo útiles para entender **la intención y el razonamiento original** detrás de varias decisiones que sí se mantuvieron (monolito modular, .NET LTS, multi-tenant de BD única, no pagar servicios desde la plataforma). No son confiables como descripción de:

- Qué tecnología usa el frontend (Angular → falso, es React).
- Qué tan aislado está cada tenant a nivel de base de datos (RLS → falso, no existe).
- Qué notificaciones recibe un cliente (WhatsApp → falso, no existe ninguna).
- Cómo se cobra a una barbería (Wompi → falso, no se cobra nada todavía).
- Cuántas fases tomó construir el producto (12+ fases secuenciales → falso, se construyó de forma iterativa sobre producto real).

Ver `docs/documentation-audit.md` para el veredicto documento por documento.
