# 10 — Backups y Disaster Recovery

## 1. Objetivos

| Métrica | Objetivo v1 |
|---------|-------------|
| **RPO** (pérdida máxima de datos) | ≤ 15 minutos (WAL continuo) |
| **RTO** (tiempo máximo de recuperación) | ≤ 4 horas (VPS nuevo desde cero) |
| Retención | 30 días mínimo (full + WAL); 12 meses de fulls mensuales |

## 2. Estrategia PostgreSQL

Herramienta: **pgBackRest** (alternativa equivalente: wal-g). No `pg_dump` como mecanismo primario — no da PITR.

- **Full backup diario** (madrugada America/Bogota) + **archivado continuo de WAL** → *point-in-time recovery* a cualquier minuto de los últimos 30 días.
- Destino: bucket S3-compatible **fuera del VPS** (Cloudflare R2 / Backblaze B2), cifrado en reposo (cifrado de pgBackRest con clave propia) y en tránsito.
- Adicional: `pg_dump --format=custom` semanal como respaldo lógico portable (restores selectivos y migraciones de versión mayor).
- Verificación: `pgbackrest verify` tras cada backup + alerta si el último backup exitoso tiene > 26h.
- Lo que **no** se respalda por esta vía: archivos de storage (R2 tiene su propio versioning + replicación), imágenes Docker (reproducibles desde GHCR), configuración (versionada en git; `.env` respaldado cifrado por separado).

## 3. Restauración por tenant

Con BD única (pool), la restauración granular es **lógica**, y se diseña como procedimiento operativo desde ya:

1. Restaurar el backup PITR al momento deseado en una **instancia paralela temporal** (contenedor postgres efímero en el mismo VPS o en otro host).
2. Exportar las filas del tenant afectado: script versionado que recorre el grafo de tablas en orden de dependencias (`COPY ... WHERE tenant_id = $1`).
3. Reinsertar en producción de forma controlada (upsert transaccional, con auditoría del evento de restauración).

Casos cubiertos: borrado accidental masivo por un tenant, corrupción lógica por bug. Caso no cubierto por diseño: "rebobinar" un tenant sin afectar a otros a nivel físico — limitación aceptada y documentada de la Opción A.

## 4. Pruebas de restauración (lo que no se prueba, no existe)

- **Mensual**: restore completo automatizado a contenedor efímero + chequeos de integridad (conteos por tabla, última cita conocida) + reporte.
- **Trimestral**: simulacro de DR completo (ver §5) con tiempo medido contra el RTO.
- Resultado registrado en `deploy/runbooks/dr-drills.md`.

## 5. Disaster Recovery Plan (pérdida total del VPS)

Inventario para reconstruir desde cero: repos git (código + deploy), imágenes en GHCR, backups en R2/B2, `.env` cifrado fuera del VPS, DNS en Cloudflare.

1. Provisionar VPS nuevo (script de bootstrap versionado: docker, ufw, fail2ban, usuario deploy).
2. Restaurar `.env` desde el almacén cifrado.
3. `docker compose pull` con el último sha desplegado.
4. Restore de PostgreSQL con pgBackRest desde R2 (PITR al último WAL).
5. Switch de DNS (TTL bajo, 300s, mantenido siempre).
6. Smoke tests + verificación de webhooks (re-registrar URLs si cambió el dominio base).

Escenarios contemplados: fallo de hardware del VPS, ransomware/compromiso (backups inmutables con object-lock en el bucket → no borrables con las credenciales del VPS), borrado humano, fallo del proveedor (restore en proveedor alternativo).
