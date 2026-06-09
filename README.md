# BarberOS

Plataforma SaaS multi-tenant para barberías. Los clientes finales la usan gratis; las barberías pagan una suscripción mensual por plan. Mercado inicial: Colombia, con diseño preparado para expansión internacional.

> **Estado del proyecto: Fase 0 aprobada con observaciones menores (2026-06-09).**
> Este repositorio contiene exclusivamente documentación de análisis, arquitectura y diseño ([acta de cierre](docs/00-fase0-checklist.md)).
> No existe código fuente todavía. La implementación de la Fase 1 inicia tras la planificación detallada y la confirmación de sincronización del remoto.

---

## Decisiones arquitectónicas clave

| # | Decisión | Resumen | ADR |
|---|----------|---------|-----|
| 1 | **Monolito modular + Clean Architecture** | Un solo desplegable con módulos de frontera estricta. Microservicios descartados para esta etapa. | [ADR-001](docs/adr/ADR-001-monolito-modular.md) |
| 2 | **Multi-tenant: BD única + TenantId + RLS** | Opción A (pool) con Row Level Security de PostgreSQL como segunda línea de defensa. Ruta de evolución a híbrido para tenants Enterprise. | [ADR-002](docs/adr/ADR-002-multitenant-pool-rls.md) |
| 3 | **.NET 10 LTS y política de versiones** | .NET 9 (STS) salió de soporte el 12-may-2026. Decisión formal: .NET 10 LTS + política solo-LTS, upgrades entre fases con criterios definidos (también para Angular). | [ADR-011](docs/adr/ADR-011-estrategia-versiones.md) |
| 4 | **Redis diferido (no en v1)** | Rate limiting in-process, refresh tokens en PostgreSQL, caché con HybridCache (backend in-memory). Triggers definidos para introducir Redis sin refactor. | [ADR-004](docs/adr/ADR-004-redis-diferido.md) |
| 5 | **Eventos vía Outbox transaccional** | Domain events in-process; integration events persistidos en outbox y despachados por worker. Garantiza que WhatsApp/notificaciones nunca se pierdan. | [ADR-005](docs/adr/ADR-005-outbox-eventos.md) |
| 6 | **Storage: Cloudflare R2 (prod) + MinIO (dev)** | API S3-compatible vía `IStorageProvider`. Cero costo de egreso. Nada de binarios en PostgreSQL. | [ADR-006](docs/adr/ADR-006-storage-r2.md) |
| 7 | **Pagos: Wompi primario, capa desacoplada** | `IPaymentProvider` con modelo genérico intent/charge/refund. Mercado Pago segundo; Stripe/PayPal listos por contrato. | [ADR-007](docs/adr/ADR-007-pagos-wompi.md) |
| 8 | **Anti doble-reserva a nivel de BD** | `EXCLUDE USING gist` sobre rango temporal por barbero. La regla crítica del negocio no depende solo de código de aplicación. | [03-modelo-datos](docs/03-modelo-datos.md) |
| 9 | **Sin pagos de servicios** | BarberOS nunca procesa el dinero de los cortes: el pago es entre cliente y barbero. La plataforma solo cobra la suscripción SaaS mensual. Precios de servicios = informativos. | [ADR-007](docs/adr/ADR-007-pagos-wompi.md) |
| 10 | **Penalización por cancelación** | Recargo configurable por barbería (PenaltyPolicy/Record/History/Waiver) aplicado al precio mostrado de la siguiente reserva. Nunca es un cobro de plataforma. | [ADR-009](docs/adr/ADR-009-penalizaciones.md) |
| 11 | **URLs: ruta pública por slug + panel único** | `barberos.com/{slug}` para clientes (SEO concentrado); `app.barberos.com` para el panel, con tenant por JWT y nunca por URL. Subdominios por tenant descartados. | [ADR-008](docs/adr/ADR-008-url-estrategia.md) |
| 12 | **Gobernanza arquitectónica** | El arquitecto puede cuestionar requisitos ante riesgos o alternativas superiores; todo cambio estructural exige ADR previo con requisitos afectados y propagación a roadmap/modelo de datos. | [ADR-010](docs/adr/ADR-010-gobernanza-arquitectonica.md) |
| 13 | **Política de No-Show** | Tolerancia, recargo incrementado sobre la mecánica de penalizaciones, bloqueo temporal/permanente de reservas y perdón manual — todo configurable por barbería y auditable. | [ADR-012](docs/adr/ADR-012-no-show.md) |

## Índice de documentación

| Documento | Contenido |
|-----------|-----------|
| [00 — Checklist de cierre Fase 0](docs/00-fase0-checklist.md) | Estado de validación y aprobaciones pendientes |
| [01 — Arquitectura](docs/01-arquitectura.md) | Estilo arquitectónico, capas, módulos, CQRS, DDD, eventos |
| [02 — Multi-tenant](docs/02-multi-tenant.md) | Análisis comparativo A/B/C, decisión, resolución de tenant, aislamiento |
| [03 — Modelo de datos](docs/03-modelo-datos.md) | Convenciones, ER, entidades, índices, estrategia de crecimiento |
| [04 — Dominio y módulos](docs/04-dominio-y-modulos.md) | Roles, permisos, reglas de negocio por módulo, KPIs |
| [05 — Seguridad](docs/05-seguridad.md) | AuthN/AuthZ, JWT, refresh rotation, hardening, datos personales |
| [06 — Estándares de API](docs/06-api-standards.md) | Versionado, ProblemDetails, paginación, idempotencia |
| [07 — Frontend](docs/07-frontend.md) | Angular 21, design system, mobile-first, estructura |
| [08 — Observabilidad](docs/08-observabilidad.md) | Logging estructurado, correlación, health checks, error tracking |
| [09 — DevOps y CI/CD](docs/09-devops-cicd.md) | Entornos, VPS, Nginx, pipeline, despliegue, rollback |
| [10 — Backups y DR](docs/10-backups-dr.md) | Backup continuo, retención, restauración por tenant, plan DR |
| [11 — Escalabilidad](docs/11-escalabilidad.md) | Plan por etapas: 10 / 100 / 1.000 / 10.000 barberías |
| [12 — Roadmap](docs/12-roadmap.md) | Fases 0–12 con alcance y criterios de salida |
| [13 — Riesgos](docs/13-riesgos.md) | Riesgos técnicos, de seguridad, costos y operación, con mitigaciones |

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | .NET 10 LTS (recomendado — ver ADR-003), ASP.NET Core Web API, EF Core |
| Base de datos | PostgreSQL 17 |
| Frontend | Angular 21, TypeScript, TailwindCSS |
| Infraestructura | Docker, Docker Compose, Nginx, Ubuntu Server VPS |
| Autenticación | JWT + Refresh Tokens con rotación y detección de reutilización |
| Observabilidad | Serilog (JSON), Correlation/Request ID, Health Checks, OpenTelemetry-ready |

## Estructura de solución prevista (Fase 1+)

```
BarberOS/
├── src/
│   ├── BarberOS.Domain/          # Entidades, value objects, domain events, reglas puras
│   ├── BarberOS.Application/     # Casos de uso (commands/queries), contratos, validaciones
│   ├── BarberOS.Infrastructure/  # EF Core, proveedores (WhatsApp, pagos, storage), outbox
│   └── BarberOS.API/             # Endpoints, middleware, composición
├── frontend/
│   └── BarberOS.Frontend/        # Angular 21 (standalone + signals)
├── tests/
│   ├── BarberOS.Domain.Tests/
│   ├── BarberOS.Application.Tests/
│   └── BarberOS.Api.IntegrationTests/
├── deploy/                       # Compose, nginx, scripts (Fase 1)
└── docs/                         # Este conjunto de documentos
```

## Convenciones del repositorio

- **Idioma**: código, identificadores y mensajes de commit en **inglés**; documentación funcional en **español**.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- **Branching**: trunk-based. `main` siempre desplegable; ramas cortas `feat/...`, `fix/...` con PR obligatorio y CI verde.
- **Versionado**: SemVer para la API; tags `vX.Y.Z` generan imagen Docker.
- **ADRs**: toda decisión arquitectónica relevante se registra en `docs/adr/` y no se revierte sin un ADR que la reemplace.
