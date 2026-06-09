# ADR-012 — Política de No-Show: registro, bloqueos y penalización incrementada

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

Requisito del product owner (cierre de Fase 0): existía el estado `NoShow` en la cita y un contador en CRM, pero ninguna política formal para clientes que no se presentan. El no-show es más dañino que la cancelación tardía (la cancelación al menos avisa); requiere consecuencias propias, configurables por barbería, modeladas desde Fase 0 para evitar rediseños. Requisitos afectados: módulo Reservas, módulo CRM, penalizaciones ([ADR-009](ADR-009-penalizaciones.md)), métricas.

## Decisión

Submódulo **NoShow** dentro de Booking, hermano de Penalties y reutilizando su mecánica de recargo.

### Entidades (diseño conceptual — detalle en [03-modelo-datos](../03-modelo-datos.md))

- **`no_show_policies`** — una por tenant, configurable por el Admin:

| Parámetro | Significado | Default |
|-----------|-------------|---------|
| `is_enabled` | activar/desactivar consecuencias de no-show | off |
| `tolerance_minutes` | minutos de gracia tras la hora de inicio antes de poder marcar no-show | 15 |
| `max_no_shows` | faltas toleradas dentro del período antes de aplicar consecuencias | 1 |
| `evaluation_period_days` | período móvil de conteo | 90 |
| `penalty_increment_percentage` | recargo **adicional** sobre el de la política de cancelación para la siguiente reserva | 25 % |
| `temporary_block_days` | duración del bloqueo temporal de reservas al superar `max_no_shows` | 0 (sin bloqueo) |
| `permanent_block_threshold` | nº de no-shows en el período que dispara bloqueo permanente | null (desactivado) |
| `allow_manual_waiver` | permitir perdón manual por el staff | true |

- **`no_show_records`** — falta registrada: cliente, cita (única), porcentaje de recargo aplicado (snapshot), estado (`Active | Consumed | Waived | Expired`), vínculo al `penalty_record` generado.
- **`no_show_history`** — append-only de todo el ciclo (creación, consumo, perdón, expiración, bloqueos aplicados/levantados, actor, motivo).

El estado de bloqueo vive en el cliente (`customers.booking_blocked_until`, `customers.booking_block_reason`, permanente cuando `booking_blocked_until` es infinito lógico), siempre con su causa trazada en `no_show_history`.

### Reglas de negocio

1. **Marcado**: el staff marca el no-show solo después de `tolerance_minutes` desde la hora de inicio (validación de dominio); el worker sugiere candidatas (citas `Confirmed` vencidas) pero **nunca marca automáticamente** — la decisión es humana, el cliente pudo llegar tarde y ser atendido.
2. **Consecuencia económica**: superado `max_no_shows`, cada nueva falta genera un `PenaltyRecord` (mecánica de [ADR-009](ADR-009-penalizaciones.md)) cuyo porcentaje = porcentaje de la política de cancelación **+** `penalty_increment_percentage`. Un solo recargo combinado por reserva; siempre informativo (BarberOS no cobra).
3. **Bloqueo temporal**: si `temporary_block_days` > 0, al superar el cupo el cliente no puede reservar online en esa barbería hasta la fecha; la barbería sí puede crearle citas desde el panel (override consciente).
4. **Bloqueo permanente**: al alcanzar `permanent_block_threshold`; reversible solo por perdón manual del Admin (con motivo, auditado).
5. **Perdón manual**: si `allow_manual_waiver`, el staff perdona una falta (estado `Waived` + actor y motivo obligatorio en `no_show_history`); perdonar la falta recalcula bloqueos derivados.
6. **Transparencia**: la página pública muestra la política; el cliente bloqueado ve el motivo y hasta cuándo; el recargo se muestra **antes** de confirmar la reserva.
7. Eventos de dominio: `NoShowRecorded`, `NoShowWaived`, `CustomerBookingBlocked`, `CustomerBookingUnblocked` (integration events → notificaciones y auditoría).

### KPIs nuevos (módulo Metrics)

| KPI | Definición |
|-----|------------|
| No-shows por mes | count de `no_show_records` por período |
| Clientes reincidentes (no-show) | clientes con ≥ 2 no-shows en el período de evaluación |
| Horas perdidas | suma de duración de citas marcadas `NoShow` |
| Ingresos potencialmente perdidos por no-show | suma de `base_price` de citas `NoShow` |

## Alternativas descartadas

- **Marcado automático por timeout**: riesgo de castigar clientes atendidos con retraso sin actualizar la cita; el costo de un falso positivo (cliente bloqueado injustamente) supera el ahorro.
- **Cobro de la falta**: prohibido por el modelo de negocio (BarberOS no procesa pagos de servicios).
- **Una sola política fusionada cancelación+no-show**: se mantienen políticas separadas porque las conductas y su gravedad difieren; comparten la mecánica de `PenaltyRecord` para no duplicar el modelo de recargos.

## Consecuencias

- (+) El comportamiento más costoso para la barbería tiene consecuencias graduales y configurables (recargo → bloqueo temporal → bloqueo permanente), todas auditables y perdonables.
- (+) Reutiliza Penalties: un único punto de cálculo de recargos en la cotización de reservas.
- (−) La cotización de una reserva ahora consulta dos políticas; encapsulado en un único servicio de dominio (`BookingPricingService` conceptual) para mantener una sola fuente de verdad.
- (→) Propagación: [03-modelo-datos](../03-modelo-datos.md), [04-dominio-y-modulos](../04-dominio-y-modulos.md), [01-arquitectura](../01-arquitectura.md) (eventos), [12-roadmap](../12-roadmap.md) (Fases 5–6, conteo de KPIs), [13-riesgos](../13-riesgos.md), README y checklist.
