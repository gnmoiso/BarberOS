# 00 — Checklist de cierre de Fase 0

> ## ✅ FASE 0 APROBADA — 2026-06-09
>
> Aprobada por el product owner **con observaciones menores**. Decisiones registradas en la aprobación:
>
> 1. **ADR-011 (.NET 10 LTS): aprobado.**
> 2. **Verificación de clientes finales: OTP por WhatsApp** (registrado en [05-seguridad](05-seguridad.md) §1).
> 3. **Dominio definitivo: pendiente** — no bloquea Fase 1 (la estrategia de ADR-008 es independiente del literal del dominio).
> 4. **Precios comerciales de planes: pendientes** — no bloquean Fases 1–7; requeridos antes de Fase 8.
>
> Observaciones aceptadas como tareas de detalle dentro de sus fases (sin rediseño): flujo de invitación de empleados (Fase 3) y alcance exacto del branding personalizable (Fase 8 / panel).
>
> La Fase 0 se marca **cerrada** al confirmarse la sincronización del repositorio remoto. La implementación de Fase 1 no inicia hasta esa confirmación y la planificación detallada de Fase 1.

Estado de validación de la documentación de arquitectura y diseño.

## Validación de cobertura

| # | Requisito | Documento(s) | Estado |
|---|-----------|--------------|:------:|
| 1 | Modelo SaaS (suscripción mensual por barbería; clientes gratis; **sin pagos de servicios**) | [README](../README.md), [04 §7-8](04-dominio-y-modulos.md), [ADR-007](adr/ADR-007-pagos-wompi.md) | ✅ |
| 2 | Estrategia multi-tenant (análisis A/B/C, BD única + RLS, resolución de tenant) | [02](02-multi-tenant.md), [ADR-002](adr/ADR-002-multitenant-pool-rls.md) | ✅ |
| 3 | Clean Architecture (capas, regla de dependencia, módulos, CQRS-ready, DDD-friendly, eventos) | [01](01-arquitectura.md), [ADR-001](adr/ADR-001-monolito-modular.md), [ADR-005](adr/ADR-005-outbox-eventos.md) | ✅ |
| 4 | Agenda de barberías (horarios con vigencia, bloqueos, vacaciones, festivos, disponibilidad) | [04 §2](04-dominio-y-modulos.md), [03](03-modelo-datos.md) | ✅ |
| 5 | Reservas (validaciones, anti doble-reserva en BD, idempotencia, estados, historial) | [04 §3](04-dominio-y-modulos.md), [03 §4](03-modelo-datos.md) | ✅ |
| 6 | Penalizaciones por cancelación (política por barbería, Record/History/Waiver, recargo informativo) | [ADR-009](adr/ADR-009-penalizaciones.md), [03](03-modelo-datos.md), [04 §3.1](04-dominio-y-modulos.md) | ✅ |
| 7 | URLs públicas por barbería (`barberos.com/{slug}`) y análisis subdominios vs rutas | [ADR-008](adr/ADR-008-url-estrategia.md) | ✅ |
| 8 | Panel administrativo (`app.barberos.com`, tenant por JWT; agenda, equipo, servicios, precios, clientes, sucursales, métricas, branding, penalizaciones, suscripción) | [04 §1](04-dominio-y-modulos.md), [07](07-frontend.md), [ADR-008](adr/ADR-008-url-estrategia.md) | ✅ |
| 9 | Observabilidad (logging estructurado, correlation/request id, health checks, error tracking, Grafana/Loki/Prometheus futuro) | [08](08-observabilidad.md) | ✅ |
| 10 | Seguridad (JWT + refresh rotation, fuerza bruta, bots, headers/CSP, device tracking, Ley 1581) | [05](05-seguridad.md) | ✅ |
| 11 | DevOps (entornos, VPS, Nginx, imágenes, despliegue, rollback, prohibición `down -v`) + CI/CD | [09](09-devops-cicd.md) | ✅ |
| 12 | Escalabilidad (plan 10 / 100 / 1.000 / 10.000 barberías con señales medibles) | [11](11-escalabilidad.md) | ✅ |
| 13 | Modelo ER, entidades, índices, estrategia de crecimiento | [03](03-modelo-datos.md) | ✅ |
| 14 | Roadmap por fases con criterios de salida | [12](12-roadmap.md) | ✅ |
| 15 | Riesgos (técnicos, escalabilidad, seguridad, costos, operativos) con mitigaciones | [13](13-riesgos.md) | ✅ |
| 16 | Backups y DR (PITR, retención 30 días, restauración por tenant, drills) | [10](10-backups-dr.md) | ✅ |
| 17 | Estándares de API (versionado, RFC 7807, paginación, orden, filtros, idempotencia) | [06](06-api-standards.md) | ✅ |
| 18 | Frontend (Angular 21, signals, design system propio, mobile first 320–428px) | [07](07-frontend.md) | ✅ |
| 19 | Gobernanza arquitectónica (autoridad de cuestionamiento, trazabilidad ADR, propagación de impacto) | [ADR-010](adr/ADR-010-gobernanza-arquitectonica.md) | ✅ |
| 20 | Estrategia de versiones (.NET 10 LTS definitivo, políticas de upgrade .NET/Angular, criterios de majors) | [ADR-011](adr/ADR-011-estrategia-versiones.md) | ✅ |
| 21 | Conclusión multi-tenant explícita (recomendación final, costos, riesgos, migración futura) | [02 §5](02-multi-tenant.md) | ✅ |
| 22 | Política de No-Show (NoShowPolicy/Record/History, tolerancia, bloqueos, perdón, 4 KPIs nuevos) | [ADR-012](adr/ADR-012-no-show.md), [04 §3.2](04-dominio-y-modulos.md), [03](03-modelo-datos.md) | ✅ |

## Decisiones del product owner

| Ítem | Detalle | Estado |
|------|---------|:------:|
| **Versión de .NET** | [ADR-011](adr/ADR-011-estrategia-versiones.md) (.NET 10 LTS + política solo-LTS) **aprobado por el PO** en la revisión de Fase 0. | ✅ |
| **Verificación de clientes** | OTP por WhatsApp antes de la primera reserva ([05-seguridad](05-seguridad.md) §1). | ✅ |
| **Aprobación de Fase 0** | **Aprobada con observaciones menores** (2026-06-09); cierre formal al sincronizar el remoto. | ✅ |
| **Dominio definitivo** | Pendiente de compra/confirmación; no bloquea Fase 1. | ⏳ |
| **Precios comerciales de planes** | Pendientes; no bloquean Fases 1–7, requeridos antes de Fase 8. | ⏳ |

## Alcance de la Fase 1 al aprobarse (resumen)

Solución .NET (Domain/Application/Infrastructure/API) + workspace Angular, CI con build/test/lint, Docker Compose de desarrollo, logging estructurado con correlación, ProblemDetails, health checks, `BaseAuditableEntity` con auditoría y soft delete, y pipeline de despliegue a staging. Detalle en [12-roadmap](12-roadmap.md).
