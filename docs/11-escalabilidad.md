# 11 — Estrategia de escalabilidad

Premisa de carga: una barbería pequeña ≈ 10–40 citas/día. Incluso 10.000 tenants ≈ 200–400k citas/día ≈ decenas de requests/segundo sostenidos con picos. **El problema de BarberOS a escala es operativo y de datos acumulados, no de throughput extremo** — el diseño aprovecha eso para mantener la infraestructura simple el mayor tiempo posible.

## Etapa 1 — 10 barberías (lanzamiento)

| Capa | Configuración |
|------|---------------|
| Infra | 1 VPS (4 vCPU / 8GB / NVMe). Todo en Docker Compose |
| API | 1 réplica + worker |
| PostgreSQL | contenedor único, tuning básico (shared_buffers 25%, etc.) |
| Cache | in-memory (HybridCache); sin Redis |
| Frontend | estáticos vía nginx |
| Storage | R2 desde el día uno (evita migración futura) |

Nada que hacer: el diseño base sobra. Foco: producto y backups probados.

## Etapa 2 — 100 barberías

- **VPS más grande (scale-up primero — es la palanca más barata)**: 8 vCPU / 16–32GB.
- CDN delante del frontend y assets (Cloudflare, ya en la cadena DNS): el booking público escala "gratis".
- PgBouncer entre API y PostgreSQL (transaction pooling) — nota: con RLS por `SET app.tenant_id`, usar pooling por transacción exige fijar la variable por transacción; diseñado así desde Fase 3.
- Caché de disponibilidad (slots) con invalidación por evento de reserva — primera caché de negocio real.
- Activar stack Grafana/Loki/Prometheus (Fase 11) si no estaba ya.
- Señal de salida de etapa: CPU sostenida > 60% o p95 API > 300ms.

## Etapa 3 — 1.000 barberías

- **Separar PostgreSQL a su propio servidor** (o managed PostgreSQL si el costo lo justifica) — primer corte real de arquitectura física.
- **Introducir Redis** (los triggers del [ADR-004](adr/ADR-004-redis-diferido.md) ya dispararon): rate limiting distribuido, HybridCache L2, locks ligeros.
- **2+ réplicas de API** detrás de nginx/HAProxy → exige lo ya diseñado: stateless total, rate limit y caché en Redis.
- Worker escalado por tipo de cola (notificaciones vs jobs) — el outbox con `FOR UPDATE SKIP LOCKED` soporta múltiples consumidores sin cambios.
- **Read replica de PostgreSQL** para Metrics/reportes y SuperAdmin.
- Particionado mensual de tablas append-only (`audit_logs`, `login_history`, `notification_messages`).
- Blue-green real de despliegue; staging permanente separado del VPS de prod.

## Etapa 4 — 10.000 barberías

- API en 3+ nodos; evaluar orquestador gestionado (k8s/Nomad) solo si la operación de compose multi-host duele — no por moda.
- PostgreSQL: servidor dedicado grande + réplicas; particionado de `appointments` por rango temporal; archivado de datos fríos (> 24 meses) a storage barato consultable.
- Si un subconjunto de tenants Enterprise domina la carga: **activar la ruta híbrida** (BD dedicada por tenant grande vía connection factory — diseñada desde Fase 0, ver [02-multi-tenant](02-multi-tenant.md)). El sharding generalizado por `tenant_id` (p. ej. Citus) es el último recurso y probablemente innecesario a esta escala de negocio.
- Notificaciones: el worker de outbox se extrae como servicio independiente con cola real (RabbitMQ/NATS) si el volumen de WhatsApp lo exige.
- Multi-región solo si la expansión internacional lo requiere por latencia/residencia de datos — decisión de negocio, no técnica anticipada.

## Reglas transversales

1. **Scale-up antes que scale-out**; scale-out antes que rearquitectura.
2. Toda decisión de Fase 0 que habilita esto sin refactor: stateless API, UUIDv7, outbox, HybridCache, connection factory tenant-aware, `tenant_id` como primera columna de índice.
3. Cada etapa tiene señales de entrada medibles (p95, CPU, tamaño de tablas) — se escala por datos de Grafana, no por intuición.
