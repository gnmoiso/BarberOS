# ADR-005 — Eventos de dominio in-process + Outbox transaccional para integración

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

El producto exige que ninguna notificación crítica (WhatsApp de confirmación/recordatorio) se pierda, y que los módulos se desacoplen por eventos, sin introducir un broker (RabbitMQ/Kafka) en la v1.

## Decisión

- **Domain events**: despachados in-process dentro de la misma transacción de `SaveChanges` (consistencia inmediata para reglas internas del módulo).
- **Integration events**: escritos en `outbox_messages` **en la misma transacción** que el cambio de negocio; un worker los lee (`FOR UPDATE SKIP LOCKED`), los despacha a los handlers (notificaciones, historiales de otros módulos, futuros webhooks salientes) y marca `processed_at`. Reintentos con backoff y dead-letter tras N intentos.
- Garantía resultante: **at-least-once** → todos los consumidores son idempotentes (clave natural o `event_id`).
- Eventos versionados (`AppointmentCreatedV1`) y con payload mínimo e inmutable.

## Alternativas descartadas

- Llamar a WhatsApp/email de forma síncrona en el request: pierde mensajes ante cualquier fallo y acopla la latencia del usuario a Meta.
- Broker dedicado en v1: pieza operativa extra sin volumen que la justifique; el outbox sobre PostgreSQL escala a múltiples consumidores y, si llega el día, el dispatcher publica al broker sin tocar productores.

## Consecuencias

- (+) Cero pérdida de eventos ante caídas; trazabilidad completa (el outbox conserva correlation id).
- (+) Camino natural a broker externo y a extracción del worker como microservicio.
- (−) Latencia de entrega = intervalo de polling (objetivo < 5s); aceptable para notificaciones de citas.
- (−) Idempotencia obligatoria en consumidores — convención de diseño desde el día uno.
