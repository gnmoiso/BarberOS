# ADR-001 — Monolito modular sobre Clean Architecture (no microservicios)

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

BarberOS arranca con un equipo de 1–2 personas, un VPS y un objetivo de miles de tenants pequeños. Se requiere CQRS-ready, DDD-friendly y event-driven-ready sin pagar hoy el costo de un sistema distribuido.

## Decisión

Un único desplegable (`BarberOS.API` + perfil worker) con Clean Architecture (Domain / Application / Infrastructure / API) y módulos verticales de frontera estricta (Tenancy, Identity, Catalog, Scheduling, Booking, CRM, Notifications, Billing, Metrics, Audit). Comunicación entre módulos exclusivamente por contratos públicos e integration events (outbox).

## Consecuencias

- (+) Despliegue, debugging, transacciones y observabilidad simples; velocidad máxima de desarrollo.
- (+) La disciplina de fronteras (verificada con tests de arquitectura en CI) deja lista la extracción futura de servicios; primer candidato: worker de notificaciones.
- (−) Exige rigor para no degradar a "big ball of mud" → reglas de dependencia automatizadas, revisión de PRs.
- (−) Escalado inicial es vertical; mitigado por diseño stateless que permite réplicas cuando toque.
