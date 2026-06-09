# ADR-009 — Penalización por cancelación: recargo informativo sobre futuras reservas

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

Las cancelaciones tardías son el mayor costo operativo de una barbería. Como BarberOS **no procesa pagos de servicios** ([ADR-007](ADR-007-pagos-wompi.md)), la penalización no puede ser un cobro: es un **recargo sobre el precio mostrado y registrado de la siguiente reserva**, que el barbero cobra directamente en persona. La política debe ser configurable por barbería, nunca global.

## Decisión

Submódulo **Penalties** dentro del módulo Booking, con cuatro entidades (`penalty_policies`, `penalty_records`, `penalty_history`, `penalty_waivers` — detalle en [03-modelo-datos](../03-modelo-datos.md)) y esta semántica:

1. **Política por tenant** (`PenaltyPolicy`), editable por el Admin de la barbería:
   - `is_enabled` — la penalización puede desactivarse por completo.
   - `penalty_percentage` — recargo (ej. 25 / 50 / 100 %).
   - `free_cancellation_window_hours` — cancelar con más antelación que la ventana **no** genera penalización.
   - `max_free_cancellations` — cancelaciones tardías toleradas por período antes de penalizar.
   - `evaluation_period_days` — período móvil en el que se cuentan las cancelaciones.
   - `penalty_expiration_days` — opcional: la penalización pendiente caduca si no se consume.
2. **Generación**: al cancelar una cita `Confirmed` dentro de la ventana de penalización y superado el cupo tolerado, se crea un `PenaltyRecord` activo para ese cliente en ese tenant (evento `PenaltyApplied`).
3. **Aplicación**: la siguiente reserva del cliente en esa barbería muestra y registra el precio recargado — ejemplo canónico: corte de $40.000 COP con penalización del 50 % → precio mostrado $60.000 COP. El desglose queda en la cita (`base_price`, `penalty_amount`, `penalty_record_id`) y el record pasa a `Consumed` al completarse la cita.
4. **Perdón**: el staff puede perdonar una penalización activa (`PenaltyWaiver`, evento `PenaltyWaived`) con motivo obligatorio y auditoría de quién perdonó.
5. **Transparencia**: el cliente ve el recargo y su motivo **antes** de confirmar la reserva (requisito UX y de protección al consumidor) y la política de la barbería es visible en su página pública.
6. Todo cambio de estado queda en `penalty_history` (append-only).

## Alternativas descartadas

- **Cobro de la penalización vía pasarela**: violaría la regla de negocio de no procesar pagos de servicios.
- **Penalización global de plataforma**: rechazada por requisito; cada barbería define la suya.
- **Bloquear la reserva al cliente penalizado**: más hostil que el recargo y destruye datos de recurrencia; queda como opción futura de política (`block_instead_of_surcharge`) si el mercado lo pide.

## Consecuencias

- (+) Disuade cancelaciones tardías sin tocar dinero; configurable de 0 % (apagado) a 100 %.
- (+) Auditable de extremo a extremo (record + history + waiver + eventos de dominio).
- (−) El cobro efectivo del recargo depende del barbero en persona; la plataforma solo lo registra — limitación inherente al modelo sin pagos y aceptada.
- (−) Reglas de conteo (período móvil, cupos) añaden lógica de dominio no trivial → casos de borde cubiertos por tests de unidad del dominio en Fase 5.
