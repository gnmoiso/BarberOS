# BarberOS

**Plataforma SaaS multi-tenant para barberías, en producción en [barberos.club](https://barberos.club).**

Gestión completa de una barbería: agenda de citas, catálogo de servicios, staff, CRM de clientes, novedades/posts y calificaciones — todo en tiempo real. Un mismo cliente puede pertenecer a varias barberías. Mercado inicial: Colombia.

**Stack**: .NET 10 (ASP.NET Core, Clean Architecture) · PostgreSQL 17 · React 19 + Vite + TailwindCSS v4 · SignalR · Docker · Nginx

> La documentación en `docs/00`–`docs/15` corresponde al plan de arquitectura original (Fase 0, escrito antes de que existiera código). Ver [`docs/current-state.md`](docs/current-state.md) para el inventario real de lo implementado y [`docs/project-evolution.md`](docs/project-evolution.md) para la historia del proyecto.

---

## Qué es BarberOS hoy

- **Backend**: API REST en ASP.NET Core (.NET 10), Clean Architecture en 4 proyectos (Domain/Application/Infrastructure/API), PostgreSQL vía EF Core, autenticación JWT (HS256) con refresh tokens rotativos por familia, tiempo real con SignalR.
- **Frontend**: aplicación React 19 + Vite + TailwindCSS v4 (reemplazó por completo al Angular planeado originalmente — ver auditoría de decisiones en `docs/project-evolution.md`). Un solo SPA con tres áreas: panel del barbero (`/barberia/*`), panel del cliente (`/user/*`) y panel de plataforma (`/super-admin`).
- **Multi-tenant real**: una base de datos, `TenantId` en las entidades de negocio, resuelto desde el claim `tenant_id` del JWT en cada request (`TenantResolutionMiddleware`) y aplicado vía EF Core global query filters. No hay Row Level Security de PostgreSQL activa (estaba en el plan original, no se implementó).
- **Despliegue**: VPS único, Docker para el backend (imagen propia) y PostgreSQL, Nginx como reverse proxy compartido con otro proyecto en el mismo servidor, frontend servido como build estático (no containerizado).
- **Sin**: Redis, outbox/eventos de integración, worker de notificaciones, proveedor de WhatsApp, proveedor de pagos (Wompi), almacenamiento en R2/MinIO (los uploads van a disco local), suscripciones/billing, Row Level Security. Todo esto estaba en el diseño de Fase 0 y no se construyó — el producto real resolvió el mismo problema de negocio con una arquitectura mucho más simple (ver más abajo, "Lo que cambió respecto al plan original").

## Lo que cambió respecto al plan original

La documentación en `docs/00` a `docs/15` (escrita el 9-10 de junio de 2026) describe la planificación de Fase 0: un sistema con microservicios descartados pero con monolito modular elaborado (Outbox, eventos de integración, worker separado), Angular 21 como frontend, RLS de PostgreSQL, verificación de clientes por OTP de WhatsApp, almacenamiento en Cloudflare R2, pagos vía Wompi, y un roadmap de 12+ fases con notificaciones y suscripciones.

Lo que realmente se construyó y está en producción es más pequeño y directo:

| Plan original (Fase 0) | Implementación real |
|---|---|
| Angular 21 + signals | **React 19 + Vite + TailwindCSS v4** |
| RLS de PostgreSQL | Solo **EF Core global query filters** por `TenantId` |
| Verificación de clientes por OTP de WhatsApp | **Códigos de invitación** alfanuméricos de 10 caracteres (+ QR opcional) |
| Storage en Cloudflare R2 | **Disco local** (`wwwroot/uploads`, montado como volumen Docker) |
| Outbox + worker de notificaciones | No implementado — no hay notificaciones push externas (WhatsApp/email) |
| Pagos vía Wompi | No implementado — no hay cobro de suscripción todavía |
| JWT con RS256 | **JWT con HS256** (un solo secreto compartido, ver `docs/05-seguridad.md` vs. realidad) |
| URLs por subdominio/slug (`barberos.com/{slug}`) | Rutas internas de SPA (`/barberia/*`, `/user/*`), sin booking público por slug |
| Roadmap de 12+ fases (Billing, WhatsApp, Métricas...) | Construido: Auth, Tenancy básica, Catálogo, Agenda, Reservas, CRM, Posts/Novedades, Calificaciones, Panel SuperAdmin |

Ver el detalle completo, módulo por módulo, en [`docs/current-state.md`](docs/current-state.md).

## Arquitectura implementada

```
src/
├── BarberOS.Domain/          # Entidades, value objects, eventos de dominio — sin dependencias externas
├── BarberOS.Application/     # Casos de uso (commands/queries con dispatcher propio, sin MediatR), abstracciones de repositorio
├── BarberOS.Infrastructure/  # EF Core + Npgsql, JWT (HS256), Argon2id, migraciones, repositorios
└── BarberOS.API/             # Controllers REST, SignalR hub, middlewares (tenant, correlación, excepciones), Program.cs
```

La regla de dependencia de Clean Architecture (`Domain` ← `Application` ← `Infrastructure`/`API`) sí se respeta: `Domain` no referencia ningún paquete externo, `Application` solo conoce interfaces, `Infrastructure` las implementa. No hay separación por "módulos verticales" con contratos entre sí tan estricta como describía el plan original — es un monolito modular más simple, organizado por carpetas de feature (`Auth`, `Appointments`, `Catalog`, `Customers`, `Posts`, `SuperAdmin`, etc.) dentro de cada capa.

### Backend — tecnologías reales

| Pieza | Tecnología real |
|---|---|
| Framework | ASP.NET Core / .NET **10** (`net10.0` en `Directory.Build.props`) |
| ORM | Entity Framework Core 10 + Npgsql |
| Base de datos | PostgreSQL 17 |
| Auth | JWT **HS256** (`Microsoft.AspNetCore.Authentication.JwtBearer`), refresh tokens con rotación por familia y detección de reuso |
| Password hashing | Argon2id (`Konscious.Security.Cryptography.Argon2`) |
| Tiempo real | SignalR (`AppointmentsHub` — citas y novedades/posts) |
| Logging | Serilog → JSON a stdout, `CorrelationIdMiddleware` propio |
| Errores | `ExceptionHandlerMiddleware` propio + `AddProblemDetails` (RFC 7807) |
| Health checks | `/health/live`, `/health/ready` (EF Core healthcheck) |
| Docs de API | Swagger/OpenAPI, solo habilitado en `Development` |
| Multi-tenant | `ITenantProvider` + `TenantResolutionMiddleware` (claim `tenant_id` del JWT) + EF global query filters |
| Tests | `tests/BarberOS.Domain.Tests`, `BarberOS.Application.Tests`, `BarberOS.Api.IntegrationTests` — **esqueleto mínimo, sin cobertura real** |

### Frontend — tecnologías reales

| Pieza | Tecnología real |
|---|---|
| Framework | React 19 + Vite 8 |
| Lenguaje | TypeScript |
| Estilos | TailwindCSS v4 (vía `@tailwindcss/vite`) |
| Routing | React Router 7 |
| HTTP | axios, con interceptor de refresh token y manejo de 403 por licencia revocada |
| Tiempo real | `@microsoft/signalr` |
| Animaciones | framer-motion |
| Iconos | lucide-react |
| QR | `qrcode` (generación), `qr-scanner` (lectura por cámara/imagen) |
| Linting | ESLint 10 + typescript-eslint |

Estructura: `frontend/src/{pages,components,contexts,hooks,services,utils,types,styles}`. Sin Angular, sin Angular Material, sin signals de Angular — todo el estado es React (`useState`/`useContext`), sin Redux ni librerías de estado externas.

### Módulos de negocio implementados

- **Auth/Identity** — registro de barbero (crea tenant) y de cliente (sin tenant inicial), login, refresh con rotación, cambio de contraseña, perfil, avatar, múltiples tenants por usuario (switch-tenant), salir de una barbería (leave-tenant).
- **Tenancy** — `Tenant` con slug, estado (`PendingLicense/Trial/Active/Suspended/Churned`), licencia denormalizada (`LicenseCode`/`LicenseExpiresAt`) verificada **en cada request** para barberos (no solo al login).
- **Licencias** — generación, extensión y eliminación de licencias por SuperAdmin; eliminar una licencia asignada revoca el acceso del barbero de inmediato.
- **Catálogo** — servicios por barbería (precio, duración, categoría).
- **Staff** — barberos, horarios semanales con descansos.
- **Agenda/Reservas** — citas (crear/cancelar/reagendar/marcar no-show), add-ons, disponibilidad por barbero/servicio/fecha.
- **CRM (Clientes)** — clientes por tenant, preferidos, penalización por inasistencia.
- **Códigos de invitación** — alfanuméricos de 10 caracteres + variante por QR (token opaco, nunca expone el código en el link/QR).
- **Novedades (Posts)** — feed por barbería + anuncios globales de plataforma, reacciones, comentarios anidados, tiempo real incremental por SignalR (no recarga el feed completo en cada interacción).
- **Calificaciones** — de servicio y de cliente.
- **Testimonios** — autogestionados por barbería, con aprobación de SuperAdmin y visibilidad configurable (home/login/registro).
- **Configuración de barbería** — precios, moneda (COP), logo, anticipación de reservas, recordatorios.
- **Panel SuperAdmin** — resumen de plataforma, gestión de barberías/licencias/clientes globales (con eliminación), configuración de contacto/logo de la plataforma, su propia cuenta (contraseña + avatar).
- **Branding** — logo configurable por barbería y a nivel de plataforma; sin tema/colores personalizables más allá del logo.

### Lo que NO existe (a pesar de estar documentado en `docs/`)

- Notificaciones por WhatsApp/email/push — cero integración.
- Pagos/suscripciones (Wompi, Mercado Pago, Stripe) — cero integración, BarberOS no cobra nada todavía.
- Row Level Security de PostgreSQL — solo filtros de aplicación (EF Core).
- Outbox transaccional / worker separado — no existen.
- Storage externo (R2/MinIO) — los archivos van a disco local del contenedor, con volumen Docker montado para persistencia.
- Booking público por slug (`barberos.com/{slug}`) sin login — toda la reserva ocurre dentro del panel autenticado.
- Verificación de identidad de clientes (OTP) — el registro es solo email + contraseña + teléfono (obligatorio y único desde 2026-06-23).
- Auditoría/AuditLog transversal como módulo — solo campos de auditoría (`CreatedAt`/`UpdatedAt`/`IsDeleted`) en las entidades.

## Guía de instalación local

### Requisitos

| Herramienta | Versión |
|---|---|
| .NET SDK | 10.0.x |
| Node.js | 20+ (usa Vite 8 / React 19) |
| Docker Desktop | para PostgreSQL local |
| PostgreSQL | 17 (vía Docker, ver `deploy/docker-compose.dev.yml`) |

### Backend

```bash
# 1. Levantar PostgreSQL de desarrollo
docker compose -f deploy/docker-compose.dev.yml up -d postgres

# 2. Variables de entorno (crear .env o usar User Secrets) — ver sección siguiente

# 3. Aplicar migraciones y levantar la API
dotnet ef database update --project src/BarberOS.Infrastructure --startup-project src/BarberOS.API
dotnet run --project src/BarberOS.API --urls http://localhost:5050
```

La API expone Swagger en `http://localhost:5050/swagger` solo en `Development`. Al iniciar siembra automáticamente un SuperAdmin con las credenciales definidas en el seeder — **cambiar de inmediato en cualquier entorno que no sea desechable** (en producción ya están rotadas).

> **Nota:** `deploy/docker-compose.dev.yml` también levanta contenedores de **MinIO** y **MailHog**. Quedan del plan original de storage/email y **no están conectados a ningún código real** — el backend no los usa. Se documentan aquí para que no generen confusión, no porque hagan falta para correr el proyecto hoy.

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:4200, proxy a la API en localhost:5050
```

### Build de producción del frontend

```bash
cd frontend
npm run build   # genera frontend/dist/ — build estático, sin Docker
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `ConnectionStrings__Database` | Sí | Cadena Npgsql a PostgreSQL |
| `Jwt__Secret` | Sí | Secreto HS256, mínimo 32 caracteres aleatorios — **nunca el placeholder de `.env.example`** |
| `Jwt__AccessTokenMinutes` | No (default 15) | Vida del access token |
| `Jwt__RefreshTokenDays` | No (default 30) | Vida del refresh token |
| `ASPNETCORE_ENVIRONMENT` | Sí | `Development` / `Production` |
| `Database__ApplyMigrationsAtStartup` | No | Si está ausente, el `Program.cs` actual igualmente llama `MigrateAsync()` sin condicionarlo — ver `docs/current-state.md` (deuda técnica) |

Para PostgreSQL en Docker (`docker-compose.yml` de despliegue, no incluido en este repo — vive solo en el VPS): `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

Ver plantilla completa en [`.env.example`](.env.example).

## Estado de despliegue

- **Producción**: `https://barberos.club`, VPS compartido con otro proyecto (TitanPro). Backend en contenedor Docker propio (`barberos-api`) + PostgreSQL en contenedor (`barberos-postgres`), ambos en la red Docker `barberos-net`.
- **Nginx**: contenedor compartido entre ambos proyectos, con upstreams nombrados explícitamente por contenedor (no por alias genérico, para evitar colisiones DNS entre proyectos).
- **Frontend**: build estático sin contenedor propio, copiado directamente al volumen que Nginx sirve.
- **CI/CD**: no hay pipeline automatizado todavía — el despliegue es manual (build + copia de archivos + rebuild de imagen Docker).
- El despliegue real, su topología exacta y los procedimientos viven fuera de este repositorio (en el propio VPS) — `docs/09-devops-cicd.md` describe el plan original (staging separado, pgBackRest, etc.), que **no se implementó tal cual**; ver `docs/current-state.md` para el estado real de DevOps.

## Roadmap actualizado

Lo siguiente más razonable a construir, en orden de impacto, dado lo ya implementado:

1. **Rotar y resolver deuda de seguridad pendiente** — confirmar que no quedan secretos placeholder en ningún entorno (ver `docs/current-state.md` §Riesgos).
2. **Notificaciones reales** (email o WhatsApp) — hoy un cliente no recibe ningún recordatorio fuera de la propia app.
3. **Cobro de suscripción** — el modelo de negocio depende de esto y no existe todavía ninguna integración de pagos.
4. **Booking público sin login** — sería el principal canal de adquisición de clientes nuevos para una barbería, y hoy no existe.
5. **Tests reales** — los proyectos de test existen pero están vacíos de cobertura significativa.
6. **CI/CD** — el despliegue manual actual es un riesgo operativo creciente a medida que cambian más cosas por sesión.

El roadmap de 12+ fases de `docs/12-roadmap.md` sigue siendo una referencia de visión de producto a largo plazo, pero su secuencia y alcance por fase ya no coincide con lo construido — tratarlo como inspiración, no como plan vigente.

## Documentación

| Documento | Vigencia | Contenido |
|---|---|---|
| [`docs/current-state.md`](docs/current-state.md) | **Vigente** | Inventario real: terminado / parcial / pendiente, deuda técnica, riesgos |
| [`docs/project-evolution.md`](docs/project-evolution.md) | **Vigente** | Historia del proyecto: Fase 0 → producción, migración Angular→React, cambios de infraestructura |
| [`docs/documentation-audit.md`](docs/documentation-audit.md) | **Vigente** | Auditoría de cada documento histórico (`docs/00`–`docs/15` + ADRs): correcto/obsoleto/parcial |
| `docs/00` a `docs/15` + `docs/adr/*` | **Histórico — planificación de Fase 0** | Útiles como contexto de decisiones e intención original; no describen el sistema real sin antes consultar la auditoría |

## Convenciones del repositorio

- **Idioma**: código, identificadores y mensajes de commit en **inglés**; documentación funcional en **español**.
- **Commits**: estilo libre orientado a Conventional Commits (`feat:`, `fix:`, `docs:`) pero sin gate de CI que lo exija.
- **Branching**: trabajo directo sobre `main` en la práctica actual (sin PRs ni CI obligatorio — difiere del plan original de trunk-based con CI verde).
