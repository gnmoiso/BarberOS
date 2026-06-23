# Estado actual de implementación

> Última verificación contra código real: 2026-06-23. Este documento reemplaza, para efectos de saber "qué existe hoy", a toda la documentación de planificación de Fase 0 (`docs/00`–`docs/15`). Ver `docs/documentation-audit.md` para el detalle documento por documento y `docs/project-evolution.md` para cómo se llegó aquí.

## 1. Funcionalidades terminadas

Verificadas contra controllers, comandos/queries y entidades de dominio reales en `src/`, y contra páginas reales en `frontend/src/pages`.

| Área | Qué hace | Evidencia |
|---|---|---|
| Registro y login | Registro de barbero (crea tenant) y de cliente (sin tenant), login, JWT + refresh con rotación por familia y detección de reuso | `AuthController`, `LoginCommandHandler`, `RefreshTokenCommandHandler`, `User.RevokeTokenFamily` |
| Multi-tenant por usuario | Un mismo usuario puede pertenecer a varias barberías (`UserTenantRole`), cambiar de barbería activa (`switch-tenant`), salir de una (`leave-tenant`) | `SwitchTenantCommandHandler`, `LeaveTenantCommandHandler` |
| Licencias y control de acceso | SuperAdmin genera/extiende/elimina licencias; revocar/eliminar una licencia asignada corta el acceso del barbero en su **siguiente request**, no solo al re-loguearse | `TenantResolutionMiddleware` (chequeo de licencia por request), `DeleteLicenseCommandHandler`, `Tenant.RevokeLicense()` |
| Catálogo de servicios | CRUD de servicios por barbería, precio en COP, duración, categoría | `ServicesController`, `Service` entity |
| Equipo / horarios | CRUD de barberos, horarios semanales con descansos | `BarbersController`, `WorkSchedule` |
| Agenda y reservas | Crear/cancelar/reagendar citas, marcar no-show, add-ons, cálculo de disponibilidad | `AppointmentsController`, `Appointment` state machine |
| CRM de clientes | Clientes por tenant, marcar preferido, penalización por inasistencia (porcentaje configurable) | `ClientsController`, `Customer` |
| Códigos de invitación | Código alfanumérico de 10 caracteres; variante QR que codifica un id opaco (nunca el código en texto) | `InvitationCodesController`, `JoinBarbershopByTokenCommandHandler` |
| Novedades (Posts) | Feed por barbería + anuncios globales de plataforma; reacciones; comentarios anidados; tiempo real incremental (SignalR, sin recargar el feed completo) | `PostsController`, `AppointmentsHub`, `GetPostByIdQueryHandler` |
| Calificaciones | De servicio y de cliente | `RatingsController` |
| Testimonios | Autogestionados por barbería, aprobación/visibilidad por SuperAdmin | `TestimonialsController`, `MyTestimonialController` |
| Configuración de barbería | Precios, moneda (COP por defecto), logo, anticipación de reservas, recordatorios | `BarbershipSettingsController` |
| Panel SuperAdmin | Resumen de plataforma, gestión de barberías/licencias, lista global de clientes (con eliminación), configuración de contacto/logo de plataforma, gestión de su propia cuenta | `SuperAdminController`, `frontend/src/pages/superadmin/SuperAdminPage.tsx` |
| Subida de imágenes | Avatar de usuario, logo de barbería, fotos de posts — a disco local con volumen persistente | `UploadsController`, volumen Docker `uploads:/app/wwwroot/uploads` |
| Navegación consistente | Logo/nombre clicable a Home o al panel propio según sesión; botón "Volver" en todas las páginas | `BrandLink`, `BackButton` (componentes compartidos del frontend) |

## 2. Funcionalidades parcialmente terminadas

| Área | Qué falta |
|---|---|
| Seguridad de cuentas | Hay lockout por intentos fallidos y rotación de refresh tokens, pero **no hay "olvidé mi contraseña" autoservicio** — la página existe (`/forgot-password`) pero solo redirige a contacto humano, porque no hay infraestructura de envío de correo |
| Teléfono único/obligatorio | Implementado a nivel de `User` (registro) con índice único filtrado en PostgreSQL, pero `Barber`/`Customer` (entidades de staff/CRM) no tienen la misma garantía de unicidad — solo `User.Phone` |
| Tiempo real | Implementado para citas y posts vía un único hub (`AppointmentsHub`, mal nombrado — también maneja posts); no hay tiempo real para licencias/tenants (SuperAdmin) ni para el feed de Novedades dentro del propio panel SuperAdmin (ese usa recarga manual) |
| Tests automatizados | Los tres proyectos de test (`BarberOS.Domain.Tests`, `BarberOS.Application.Tests`, `BarberOS.Api.IntegrationTests`) existen y compilan, pero contienen solo 1-2 archivos cada uno con pruebas mínimas (`SenderTests`, `BaseEntityTests`, `HealthChecksTests`) — no cubren reglas de negocio reales (anti doble-reserva, penalizaciones, multi-tenant) |
| Observabilidad | Serilog + correlation id están implementados; no hay OpenTelemetry/Tempo, ni dashboards, ni alertas — solo logs JSON a stdout |
| Internacionalización | El código asume Colombia (COP, formato de teléfono de 10 dígitos, zona horaria implícita) — no hay soporte multi-país pese a que el README original lo mencionaba como objetivo |

## 3. Funcionalidades pendientes (documentadas en el plan original, sin ninguna implementación)

- **Notificaciones** (WhatsApp/email/push) — cero código.
- **Pagos y suscripciones** (Wompi/Mercado Pago/Stripe) — cero código. BarberOS no cobra nada a las barberías todavía; no hay manera de hacerlo.
- **Booking público sin login** (`barberos.com/{slug}`) — toda reserva ocurre dentro del panel autenticado; no hay página pública de reserva.
- **Row Level Security de PostgreSQL** — solo hay filtros de aplicación (EF Core `HasQueryFilter`), que dependen de que el código nunca los ignore (`IgnoreQueryFilters()` se usa deliberadamente en algunos repositorios para casos cross-tenant legítimos, p. ej. buscar un usuario por email antes de saber su tenant — pero es una superficie de riesgo si se usa mal en el futuro).
- **Outbox transaccional / worker separado** — no existen; ninguna operación depende de reintentos asíncronos.
- **Storage externo** (Cloudflare R2/MinIO) — los archivos viven en disco del contenedor backend, con un volumen Docker para no perderlos en cada redeploy (corregido el 2026-06-23 tras un incidente real de pérdida de imágenes, ver `docs/project-evolution.md`).
- **CI/CD automatizado** — el repo no tiene pipeline; los despliegues son manuales vía SSH.
- **Staging** — solo existe producción; no hay ambiente intermedio.

## 4. Deuda técnica identificada

| Deuda | Detalle | Riesgo si no se atiende |
|---|---|---|
| Dockerfile de producción diverge del repositorio | El `Dockerfile` en `src/BarberOS.API/Dockerfile` especifica `USER appuser` (no-root), pero la imagen realmente desplegada en el VPS fue parcheada a `USER root` para resolver un problema de permisos de escritura en `wwwroot/uploads`. Si alguien reconstruye desde este repo sin saberlo, reintroduce el bug de permisos. | Medio — confusión al redeployar desde cero, regresión silenciosa |
| `MigrateAsync()` incondicional al arranque | `Program.cs` aplica migraciones EF automáticamente en cada arranque de la API, sin flag de configuración que lo desactive (a diferencia de lo que `.env.example`/README sugieren para otros proyectos similares en el mismo VPS) | Medio — una migración con bug se aplicaría en producción sin gate manual |
| `AppointmentsHub` maneja dos dominios | El hub de SignalR se llama "Appointments" pero también transporta eventos de "Posts" — nombre engañoso, acoplamiento innecesario entre dos features no relacionadas | Bajo — solo claridad de código |
| Cobertura de tests mínima | Los tres proyectos de test existen pero no prueban reglas de negocio reales (anti doble-reserva, penalizaciones, aislamiento multi-tenant) — exactamente las áreas que el plan original de Fase 0 marcaba como gates obligatorios de CI | Alto a mediano plazo — cualquier regresión en estas reglas pasaría sin detección automática |
| Sin CI/CD | Cualquier cambio se construye y despliega manualmente por SSH; no hay paso de "build verde" obligatorio antes de producción | Alto — ya causó al menos un incidente real (pérdida de imágenes subidas al recrear un contenedor sin volumen persistente, ver historial) |
| Volúmenes Docker fuera de este repositorio | El `docker-compose.yml` de producción real (con los volúmenes, redes, mapeos de puertos correctos) no vive en este repositorio — solo existe en el VPS. Este repo solo tiene `deploy/docker-compose.dev.yml` (desarrollo) | Medio — el repositorio no es la fuente de verdad de la topología productiva; un VPS perdido sin backup de esos archivos de configuración requeriría reconstruir la topología de memoria |
| Contenedores de desarrollo sin usar | `deploy/docker-compose.dev.yml` levanta MinIO y MailHog, pero ningún código del backend los referencia — quedaron del diseño original de storage/email | Bajo — solo ruido/confusión para quien arranca el proyecto |
| Secreto JWT y password de base de datos | Ya rotados en producción tras detectarse que tenían el valor placeholder de la plantilla (`CAMBIA_ESTA_CLAVE_...`) — confirmar que ningún otro entorno (si llega a crearse staging) repite el mismo error | Alto si se repite — placeholders conocidos permiten forjar tokens o acceder a la base de datos |

## 5. Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Notas |
|---|---|---|---|
| Fuga de datos cross-tenant | Media | Alto | Sin RLS, la única defensa es el filtro de aplicación; un nuevo `IgnoreQueryFilters()` mal puesto en el futuro no tiene una segunda línea de defensa a nivel de base de datos |
| Pérdida de datos en redeploy | Ya materializado una vez (uploads) | Alto | Cualquier directorio nuevo que el backend escriba sin volumen Docker explícito repetiría el incidente — revisar esto en cada feature nueva que escriba a disco |
| Ausencia de backups verificados | Desconocida (fuera del alcance de este repo) | Alto | El plan original de Fase 0 (`docs/10-backups-dr.md`) especifica pgBackRest + PITR; no hay evidencia en este repositorio de que exista un mecanismo de backup real en producción — **requiere verificación directa en el VPS, no asumible desde el código** |
| Sin pipeline de CI | Alta (es el modo de trabajo actual) | Medio-Alto | Cada cambio depende de que la persona que despliega recuerde correr `npm run build` y `dotnet build` localmente antes de subir — ya ha funcionado, pero no escala con más colaboradores |
| `Jwt:Secret` único y compartido (HS256) | Baja si está bien gestionado | Alto si se filtra | Con HS256 cualquiera con el secreto puede forjar tokens; el plan original sugería RS256 (asimétrico) antes de producción con alta carga — sigue pendiente |
