# 08 — Observabilidad y trazabilidad

## 1. Logging estructurado

- **Serilog** emitiendo JSON a stdout (contrato Docker: los contenedores no escriben archivos de log).
- Enriquecimiento automático en cada evento: `timestamp`, `level`, `message`, `correlation_id`, `request_id`, `trace_id` (W3C), `tenant_id`, `user_id`, `module`, `environment`, `version` (git sha).
- Niveles: `Information` para hechos de negocio (cita creada, pago aprobado), `Warning` para anomalías recuperables (reintento de WhatsApp), `Error` con excepción para fallos. Sin logs de debug en producción por defecto (conmutables por configuración sin redeploy).
- **Prohibido** loguear: tokens, contraseñas, payloads de tarjetas, PII innecesaria (teléfonos enmascarados `+57300***4567`).

## 2. Correlación

- `X-Correlation-Id`: lo trae el frontend (uuid por interacción de usuario) o lo genera el middleware; viaja en la respuesta, en todos los logs del request, en el outbox (`correlation_id` en payload) y en los mensajes del worker → **una reserva es trazable de click a WhatsApp entregado**.
- `X-Request-Id`: único por request HTTP (generado siempre en el servidor).
- W3C Trace Context (`traceparent`) habilitado desde el inicio: cuando llegue OpenTelemetry/Tempo no hay refactor.

## 3. Health checks

| Endpoint | Verifica | Consumidor |
|----------|----------|------------|
| `/health/live` | proceso responde | Docker healthcheck / restart policy |
| `/health/ready` | PostgreSQL accesible, migraciones al día, outbox sin atasco (> N pendientes viejos = degraded) | Nginx upstream / despliegue |

Expuestos solo en red interna de Docker; jamás al público.

## 4. Error tracking

- v1: **GlitchTip** (compatible API Sentry, self-hosted en el mismo VPS, liviano) o Sentry SaaS free tier — decisión por costo en Fase 11. SDK de Sentry en API y Angular desde la Fase 1 (apuntando a GlitchTip).
- Errores agrupados con release (git sha), tenant_id como tag, correlation_id en contexto.

## 5. Métricas y dashboards (fase de crecimiento)

- Diseño preparado, activación en Fase 11:
  - **Prometheus**: métricas ASP.NET (`http_request_duration`, pool de conexiones, GC), métricas de negocio (citas creadas/min, outbox pendiente, fallos de WhatsApp), node_exporter + postgres_exporter.
  - **Loki + Promtail**: agregación de logs JSON de Docker.
  - **Grafana**: dashboards API / PostgreSQL / negocio + alertas (Telegram/email): error rate > umbral, outbox atascado, disco > 80%, certificado por vencer, backup fallido.
- Mientras tanto (Fases 1–10): logs JSON + `docker logs` + GlitchTip + health checks cubren la operación de un VPS único.

## 6. Trazabilidad de negocio (complemento de auditoría)

- `audit_logs` (quién cambió qué — ver [03-modelo-datos](03-modelo-datos.md)) y los historiales (`appointment_history`, `subscription_history`, `payment_history`) son **datos de negocio**, no logs: viven en PostgreSQL, se respaldan y nunca expiran con la rotación de logs.
- Retención de logs técnicos: 30 días calientes (Loki/disco), 90 días comprimidos en storage frío; auditoría de negocio: indefinida (particionado/archivado, no borrado).
