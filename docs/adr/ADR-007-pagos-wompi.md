# ADR-007 — Pagos: Wompi primario con capa desacoplada IPaymentProvider (solo suscripción SaaS)

**Estado:** Aceptado · **Fecha:** 2026-06-09 · **Actualizado:** 2026-06-09 (alcance restringido por regla de negocio)

## Alcance — regla de negocio fundamental

**BarberOS no procesa pagos de servicios de barbería.** El cliente nunca paga dentro de la plataforma; el dinero del corte/servicio nunca pasa por BarberOS; el pago es responsabilidad exclusiva entre cliente y barbero. No existen en el diseño: checkout de citas, pasarela para servicios, cobro de servicios ni comisiones por servicio. Los precios de servicios en la plataforma son **informativos** (catálogo, reserva, métricas).

El único flujo de pago del sistema es la **suscripción SaaS mensual** que paga el dueño de la barbería.

## Contexto

Cobro de suscripciones a barberías colombianas. Los métodos que convierten en Colombia son PSE, Nequi y tarjetas. Requisito: preparado para Mercado Pago, Stripe y PayPal — exclusivamente para la suscripción.

## Decisión

- Contrato `IPaymentProvider` con modelo genérico independiente del proveedor: `CreateCheckoutSession`, `GetPaymentStatus`, `CreateRefund`, `VerifyWebhookSignature`. Las entidades (`payments`, `payment_attempts`, `invoices`, `refunds`) modelan el dominio propio, nunca el esquema de un proveedor; la respuesta cruda del proveedor se conserva en `payment_attempts.provider_response` (jsonb) para reconciliación.
- **Proveedor v1: Wompi** (Bancolombia): PSE + Nequi + tarjetas + botón Bancolombia, fuerte en el mercado objetivo, webhooks firmados, sandbox completo.
- **Segundo proveedor: Mercado Pago** (activable por configuración; además habilita Argentina/México para expansión).
- Stripe/PayPal: cubiertos por el contrato; se implementan cuando la expansión lo pida.
- Reglas: los datos de tarjeta jamás tocan el backend (checkout alojado → alcance PCI SAQ-A); el estado verdadero del pago proviene de webhook verificado + consulta activa al proveedor; procesamiento idempotente por `provider_event_id`; dunning básico (reintentos programados + gracia 5 días) en el worker.

## Alternativas descartadas

- **Stripe como primario**: soporte limitado para los métodos de pago locales que el mercado objetivo usa (PSE/Nequi) — descartado para Colombia v1.
- **Integración directa con un solo proveedor sin abstracción**: lock-in y bloqueo de expansión internacional.

## Consecuencias

- (+) Conversión máxima en Colombia; multi-país por configuración futura.
- (+) Cambio o adición de proveedor sin tocar Billing.
- (−) Dos integraciones que mantener cuando Mercado Pago se active; aceptado y acotado por el contrato común.
