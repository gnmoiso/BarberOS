# 14 — Planificación detallada de Fase 1: Fundación

> Prerrequisito: Fase 0 aprobada (2026-06-09) y repositorio remoto sincronizado.
> Este documento planifica; la implementación inicia solo con la autorización explícita de arranque de Fase 1.

## 1. Objetivo de la fase

Dejar `main` desplegable en staging con la columna vertebral técnica completa — solución .NET 10, workspace Angular 21, CI obligatorio, Docker Compose de desarrollo, observabilidad base y auditoría transversal — de modo que las Fases 2+ solo agreguen módulos de negocio sobre rieles ya probados.

**Duración estimada: 2 semanas.** Criterio de salida global: checklist §6 al 100 %.

## 2. Alcance (workstreams)

### WS1 — Esqueleto backend (.NET 10 LTS)

- Solución con 4 proyectos (`Domain`, `Application`, `Infrastructure`, `API`) + 3 de tests, según [01-arquitectura](01-arquitectura.md).
- Reglas de dependencia entre capas verificadas con tests de arquitectura (ArchUnit.NET) desde el día 1.
- Pipeline de Application: mediador + behaviors (logging → validación → transacción) sin módulos de negocio aún.
- `BaseAuditableEntity`, interceptores de EF Core (auditoría automática de `created/updated/deleted`), soft delete con filtro global, `audit_logs`.
- Outbox: tabla + dispatcher del worker (perfil worker del mismo ejecutable), sin consumidores de negocio todavía.
- Convención UUIDv7, `timestamptz`, snake_case (configuración de EF + Npgsql).

### WS2 — Esqueleto frontend (Angular 21)

- Workspace standalone + signals + zoneless; TailwindCSS con tokens del design system (CSS custom properties).
- Estructura `core/ shared/ features/` de [07-frontend](07-frontend.md); interceptors (correlation-id, errores ProblemDetails) y guards vacíos pero cableados.
- Página placeholder pública y layout base del panel, verificados en 320px y 390px (la disciplina mobile-first empieza aquí).
- ESLint + Prettier + strict TS; Playwright configurado con un smoke test trivial.

### WS3 — Entorno de desarrollo

- Docker Compose dev: PostgreSQL 17, MinIO, MailHog; la API corre local (dotnet watch) contra esos servicios.
- Scripts de arranque documentados en README de desarrollo; `.env.example` completo y validación de configuración fail-fast al arranque.

### WS4 — Observabilidad base

- Serilog JSON a stdout con enriquecimiento completo (correlation_id, request_id, trace_id, tenant_id placeholder, version).
- Middleware de correlación (`X-Correlation-Id` / `X-Request-Id`) + ProblemDetails RFC 7807 global con `errorCode`.
- `/health/live` y `/health/ready`; SDK de Sentry/GlitchTip integrado (DSN por configuración, desactivable).

### WS5 — CI/CD

- CI en PR (gate obligatorio sobre `main`): build backend warnings-as-errors, tests unitarios + integración (Testcontainers PostgreSQL), lint/build/test frontend, escaneo de dependencias y secretos.
- CD a staging en push a `main`: build de imágenes (multi-stage, non-root, tag por git sha) → GHCR → deploy por SSH (`pull` + `up -d`, jamás `down`), paso de migración como job separado, smoke test post-deploy.
- Protección de rama `main` (PR + CI verde obligatorios).

### WS6 — Staging mínimo

- VPS con bootstrap documentado (usuario deploy, ufw, fail2ban, Docker), compose de staging (nginx + api + worker + frontend + postgres), TLS Let's Encrypt.
- Runbooks iniciales: despliegue, rollback, acceso.

## 3. Secuencia y dependencias

```
Semana 1: WS1 + WS2 en paralelo · WS3 al inicio (lo usan ambos)
Semana 2: WS4 (sobre WS1) → WS5 → WS6 → estabilización y checklist
```

Decisiones del PO pendientes que **no** bloquean esta fase: dominio definitivo (staging usa subdominio provisional), precios de planes. La decisión de i18n (marcada en [07-frontend](07-frontend.md)) se toma en WS2: recomendación preliminar, arquitectura de strings extraíbles sin librería pesada hasta expansión.

## 4. Fuera de alcance (explícito)

Auth real (Fase 2), tenancy y RLS (Fase 3), cualquier módulo de negocio, Redis, Grafana/Loki/Prometheus, blue-green. Nada de esto se adelanta "porque ya estamos ahí".

## 5. Riesgos específicos de la fase

| Riesgo | Mitigación |
|--------|------------|
| Sobre-ingeniería del esqueleto (gold-plating sin negocio) | Alcance cerrado por este documento; todo extra requiere ADR |
| Fricción Testcontainers en CI Windows/Linux | Runners Linux en GitHub Actions desde el día 1 |
| VPS de staging no disponible a tiempo | WS6 puede deslizarse a inicio de Fase 2 sin bloquear WS1–WS5; el criterio de salida lo refleja como único diferible |
| Decisiones de convención tardías (naming, estructura) | Las convenciones ya están en Fase 0; cualquier desviación es PR con justificación |

## 6. Checklist de salida de Fase 1

- [ ] Solución .NET 10 con 4+3 proyectos compila con warnings-as-errors; tests de arquitectura verdes.
- [ ] `BaseAuditableEntity` + interceptores de auditoría + soft delete probados con una entidad de ejemplo desechable.
- [ ] Outbox dispatcher funcionando con un evento de prueba end-to-end (API → outbox → worker → log).
- [ ] Frontend Angular sirve página pública y layout de panel en 320px sin scroll horizontal.
- [ ] `docker compose up` local levanta PostgreSQL + MinIO + MailHog y la API pasa `/health/ready`.
- [ ] CI obligatorio en PRs; un PR de prueba demuestra el gate completo.
- [ ] CD despliega a staging automáticamente desde `main`; smoke test post-deploy verde.
- [ ] Logs JSON con correlation id visibles de extremo a extremo en staging.
- [ ] Runbooks de despliegue y rollback escritos y probados una vez.
- [ ] Cero código de módulos de negocio (verificación de alcance).
