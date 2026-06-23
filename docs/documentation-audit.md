# Auditoría de documentación

> Generado el 2026-06-23. Cada documento de `docs/00` a `docs/15` y cada ADR fue comparado contra el código real (`src/`, `frontend/`, migraciones EF Core, controllers). Veredicto: **Correcto** (sigue describiendo la realidad), **Obsoleto** (ya no aplica, describe algo que se descartó o nunca se construyó), **Parcialmente correcto** (parte se construyó, parte no, o se construyó distinto), **Requiere actualización** (la idea sigue vigente pero el detalle quedó atrás).

## Documentos numerados

| Documento | Veredicto | Por qué |
|---|---|---|
| `00-fase0-checklist.md` | **Obsoleto** | Es el acta de cierre de una fase de planificación que ya terminó hace mucho tiempo; el repositorio ya no está "sin código fuente todavía" como decía el README de esa época. Útil solo como registro histórico de qué se aprobó el 2026-06-09. |
| `01-arquitectura.md` | **Parcialmente correcto** | La regla de dependencia entre capas (Domain/Application/Infrastructure/API) y el monolito modular sí se respetan. Todo lo demás no: no hay módulos "Notifications"/"Billing"/"Audit" como bounded contexts, no hay outbox, no hay worker separado, el catálogo de eventos de dominio/integración listado no existe en el código (no hay despacho de integration events). Se agregó una nota al inicio del documento señalando esto — ver sección siguiente. |
| `02-multi-tenant.md` | **Parcialmente correcto** | La decisión de fondo (BD única + `TenantId`, Opción A) sí se implementó. La "segunda línea de defensa" con RLS de PostgreSQL, mencionada como parte central de la decisión, **no se implementó** — solo hay filtros de aplicación vía EF Core (`HasQueryFilter`). Esto es una desviación de seguridad real, no solo de detalle. |
| `03-modelo-datos.md` | **Parcialmente correcto** | Convenciones que sí se siguieron: UUIDv7 como PK, `timestamptz`, soft delete con filtro parcial, `numeric` para dinero (nunca float). El constraint anti doble-reserva con `EXCLUDE USING gist` mencionado como decisión clave del README **no se verificó en este repositorio** (no se encontró en migraciones); requiere confirmación directa en el esquema de PostgreSQL antes de afirmar que existe. El modelo de entidades real (`Tenant`, `User`, `UserTenantRole`, `Service`, `Barber`, `Customer`, `Appointment`, `InvitationCode`, `BarbershipLicense`, `Post`, etc.) diverge bastante del modelo conceptual descrito (no hay `Branch`/sucursales, no hay `Plan` de suscripción). |
| `04-dominio-y-modulos.md` | **Obsoleto** | Describe roles "Admin Barbería (Owner/Admin)" como un rol propio; en el código real los roles son `SuperAdmin`, `Barber`, `Customer` — no existe un rol "Admin" separado de "Barber". La matriz de permisos y KPIs descritos no corresponden a lo implementado. |
| `05-seguridad.md` | **Parcialmente correcto** | Argon2id para contraseñas: correcto. Refresh tokens con rotación y familias, detección de reuso: correcto, está implementado. Lo que es **incorrecto**: el JWT usa **HS256**, no RS256/ES256 como dice el documento. La verificación de clientes por OTP de WhatsApp **no existe** — el registro es solo email+contraseña+teléfono. |
| `06-api-standards.md` | **Parcialmente correcto** | Versionado por URL (`/api/v1/...`) y ProblemDetails (RFC 7807) sí están implementados. No existe la separación de endpoints de plataforma bajo `/api/v1/admin/**` — el panel SuperAdmin vive bajo `/api/v1/super-admin/**`, ligeramente distinto del estándar descrito. |
| `07-frontend.md` | **Obsoleto** | Describe Angular 21 con signals y zoneless change detection. El frontend real es **React 19 + Vite**. No existe ningún código Angular en el repositorio. Tampoco existen las tres áreas lazy-loaded (`booking`/`panel`/`platform`) como apps separadas — es un solo SPA de React con rutas internas. |
| `08-observabilidad.md` | **Parcialmente correcto** | Serilog con JSON a stdout y un `CorrelationIdMiddleware` propio sí existen. No hay enriquecimiento con `tenant_id`/`user_id`/`module`/`version` por evento de log verificable en el código actual más allá de lo que Serilog agrega por defecto — no se confirmó el nivel de detalle exacto descrito. No hay OpenTelemetry ni ningún backend de trazas. |
| `09-devops-cicd.md` | **Obsoleto** | Describe tres entornos (dev/staging/prod) con paridad de imagen Docker y un pipeline CI/CD. La realidad: solo existe producción, no hay staging, no hay pipeline — el despliegue es manual vía SSH. La topología de VPS descrita (dedicado a BarberOS) tampoco aplica: el VPS real es compartido con otro proyecto. |
| `10-backups-dr.md` | **Requiere verificación directa en el VPS** | Este repositorio no contiene evidencia de que pgBackRest, WAL continuo o cualquier mecanismo de backup descrito esté realmente configurado en producción. No se puede confirmar ni desmentir desde el código — es el documento de mayor riesgo si nadie lo ha verificado contra la realidad del servidor. |
| `11-escalabilidad.md` | **Obsoleto** | Describe un plan de escalado por etapas (10/100/1.000/10.000 barberías) que presupone Redis, R2, particionado, etc. — ninguno de esos componentes existe hoy. El documento es visión a futuro razonable, no estado actual. |
| `12-roadmap.md` | **Obsoleto** | El roadmap secuencial de 12+ fases (Fundación → Auth → Multi-tenant → Agenda → Reservas → Clientes → WhatsApp → Suscripciones...) no es como avanzó el desarrollo real (ver `docs/project-evolution.md`). Varias fases del roadmap (WhatsApp, Suscripciones) siguen sin construirse, mientras que otras funcionalidades no listadas explícitamente en ese orden (Novedades/Posts, panel SuperAdmin extendido) ya están en producción. |
| `13-riesgos.md` | **Parcialmente correcto** | Los riesgos identificados (fuga cross-tenant, doble reserva, migraciones destructivas) siguen siendo válidos como categorías de riesgo, pero las mitigaciones descritas (RLS, ArchUnit.NET en CI, gate de backup pre-migración) **no existen**. Ver `docs/current-state.md` §5 para el inventario de riesgos actualizado con mitigaciones reales (o su ausencia). |
| `14-fase1-plan.md` | **Obsoleto** | Planifica una "Fase 1: Fundación" de 2 semanas como paso previo a construir funcionalidad de negocio. El desarrollo real no siguió esta secuencia — fue directo a construir funcionalidad completa de producto (ver `docs/project-evolution.md`). |
| `15-arranque-local.md` | **Requiere actualización** | Sigue siendo el documento más cercano a la realidad operativa (requisitos de .NET SDK, Docker), pero no menciona Node/npm para el frontend React (sigue asumiendo o no menciona el frontend en absoluto, escrito antes o durante la migración). Verificar y completar con los pasos de `npm install`/`npm run dev` ya documentados en el README actualizado. |

## ADRs (`docs/adr/`)

| ADR | Veredicto | Por qué |
|---|---|---|
| ADR-001 — Monolito modular | **Correcto** | La decisión se mantiene: un solo desplegable, Clean Architecture en capas. Sigue siendo una descripción válida de la arquitectura real, aunque la separación interna por "módulos con contratos estrictos" es más laxa en la práctica (organización por carpetas de feature, no por bounded context con eventos de integración). |
| ADR-002 — Multitenant pool + RLS | **Parcialmente correcto** | "Pool" (BD única + `TenantId`) sí. "RLS" no — nunca se activó. La decisión documentada describe RLS como "segunda línea de defensa", que en la práctica no existe; la defensa real es de una sola línea (filtros de aplicación). |
| ADR-003 — .NET 10 LTS | **Correcto** | `Directory.Build.props` confirma `net10.0`. Decisión vigente y cumplida. |
| ADR-004 — Redis diferido | **Correcto** | Sigue diferido; no hay Redis en ninguna parte del código ni de la infraestructura conocida. |
| ADR-005 — Outbox transaccional de eventos | **Obsoleto** | No existe outbox, no existe worker, no existen integration events despachados. Ninguna funcionalidad de notificaciones depende de esto porque las notificaciones mismas no existen. |
| ADR-006 — Storage Cloudflare R2 | **Obsoleto** | Los archivos van a disco local (`wwwroot/uploads`) con un volumen Docker. No hay `IStorageProvider`, no hay R2, no hay MinIO conectado a código real (el contenedor de MinIO existe en `deploy/docker-compose.dev.yml` pero nada lo usa). |
| ADR-007 — Pagos Wompi | **Obsoleto** | No existe `IPaymentProvider`, no existe integración con Wompi ni ningún otro proveedor de pagos. La regla de negocio "BarberOS nunca cobra los servicios de corte" sigue siendo correcta como principio (no hay ningún flujo de cobro de servicios), pero tampoco hay cobro de la suscripción SaaS — la plataforma no cobra nada todavía. |
| ADR-008 — URLs por slug | **Obsoleto** | No hay booking público por slug ni subdominio de panel. Las rutas son internas del SPA (`/barberia/*`, `/user/*`, `/super-admin`), resueltas todas dentro de la misma app React, no por dominio/subdominio. |
| ADR-009 — Penalizaciones | **Parcialmente correcto** | La regla de negocio (recargo configurable, nunca cobro de plataforma) se mantiene y está implementada, pero de forma más simple que el diseño original: un porcentaje de penalización directo en `Customer`, no el conjunto completo `PenaltyPolicy`/`PenaltyRecord`/`PenaltyHistory`/`PenaltyWaiver` descrito. |
| ADR-010 — Gobernanza arquitectónica | **Correcto** | Es una decisión de proceso, no de código — sigue siendo el mandato vigente (confirmado explícitamente por el product owner en sesiones posteriores a Fase 0). |
| ADR-011 — Estrategia de versiones | **Correcto** | Coherente con ADR-003; .NET 10 LTS en uso. |
| ADR-012 — No-show | **Parcialmente correcto** | `NoShowPolicy` existe como entidad de dominio y se usa en `MarkNoShowCommandHandler`, pero no se encontró ningún controller/endpoint para que una barbería configure su propia política de no-show desde el panel — está modelado en el dominio pero no expuesto en la API ni en el frontend. Tratar como "implementado a medias": la mecánica de marcar no-show sí funciona, la configurabilidad de la política no es accesible para el usuario final. |

## Resumen cuantitativo

- **Correcto**: 4 (ADR-001, ADR-003, ADR-004, ADR-010, ADR-011) — en su mayoría decisiones de alto nivel que no dependen de detalle de implementación.
- **Parcialmente correcto**: 8 (01, 02, 03, 05, 06, 08, 13 + ADR-002, ADR-009, ADR-012)
- **Obsoleto**: 7 (00, 04, 07, 09, 11, 12, 14 + ADR-005, ADR-006, ADR-007, ADR-008)
- **Requiere actualización/verificación directa**: 2 (10-backups-dr.md, 15-arranque-local.md)

**Ningún documento de `docs/00` a `docs/15` ni ningún ADR describe correctamente y por completo el sistema real sin matices.** El documento más confiable de todo el conjunto histórico es `06-api-standards.md` (parcialmente correcto, pero los aciertos son los más centrales: versionado y ProblemDetails sí están implementados tal cual se diseñaron).

## Qué hacer con esto

No se eliminó ni se sobrescribió ningún documento histórico — todos siguen en `docs/` como registro de la intención y el razonamiento original, que en varios casos sigue siendo válido como *decisión* aunque no como *estado actual*. Para saber qué existe hoy, usar:

1. `docs/current-state.md` — inventario funcional real.
2. `docs/project-evolution.md` — cómo se llegó del plan a la realidad.
3. Este documento — veredicto rápido por archivo histórico, para no tener que releer los 16 documentos completos cada vez.
