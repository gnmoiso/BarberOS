# ADR-002 — Multi-tenant: base de datos única con TenantId + Row Level Security

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

Miles de barberías pequeñas, aislamiento de datos absoluto, un VPS, equipo mínimo. Opciones evaluadas: (A) BD única con `tenant_id`, (B) schema por tenant, (C) BD por tenant. Análisis completo en [02-multi-tenant](../02-multi-tenant.md).

## Decisión

**Opción A** con defensa en profundidad:

1. `tenant_id` en toda tabla de negocio (en `BaseAuditableEntity`).
2. Filtro global de EF Core desde `ITenantContext` (primera defensa).
3. **RLS de PostgreSQL** con `SET app.tenant_id` por transacción y rol de aplicación sin `BYPASSRLS` (segunda defensa, independiente del ORM).
4. Índices compuestos con `tenant_id` como primera columna.
5. Connection factory tenant-aware → ruta de evolución a BD dedicada para tenants Enterprise sin tocar los módulos.

## Alternativas descartadas

- **B (schema/tenant)**: migraciones ×N, drift de esquema, degradación del catálogo de PostgreSQL con miles de schemas, sin soporte natural en EF Core. El peor balance.
- **C (BD/tenant)**: aislamiento perfecto pero costo operativo (backups, migraciones, conexiones, monitoreo) inviable para miles de tenants en VPS. Queda como opción selectiva futura para Enterprise vía la ruta híbrida.

## Consecuencias

- (+) Costo marginal por tenant ≈ 0; una migración, un backup, una base que tunear.
- (+) Una fuga cross-tenant requiere fallar dos mecanismos independientes; suite de fuga en CI como tercera red.
- (−) Restauración por tenant es lógica, no física (procedimiento en [10-backups-dr](../10-backups-dr.md)).
- (−) RLS + PgBouncer exige `SET` por transacción — restricción conocida y diseñada desde el inicio.
- (−) Noisy neighbor posible → rate limiting por tenant + ruta híbrida.
