# 12 — Roadmap por fases

Estimaciones para un equipo de 1–2 desarrolladores con dedicación alta. Cada fase termina con su criterio de salida cumplido y desplegado en staging; las semanas son orientativas y se recalibran al cerrar cada fase.

| Fase | Nombre | Alcance | Criterio de salida | Est. |
|------|--------|---------|--------------------|------|
| **0** | Arquitectura | Este conjunto de documentos; decisiones ADR; aprobación | Fase 0 aprobada explícitamente | ✔ |
| **1** | Fundación | Solución .NET (4 proyectos) + Angular workspace; CI (build+test+lint); Docker Compose dev (PostgreSQL, MinIO, MailHog); Serilog + correlation/request id + ProblemDetails + health checks; `BaseAuditableEntity`, interceptores de auditoría y soft delete; pipeline CD a staging | `main` desplegable en staging con `/health/ready` verde y CI obligatorio en PRs | 2 sem |
| **2** | Autenticación | Registro, login, JWT + refresh rotation con familias, verificación email, password reset, lockout, rate limiting auth, login history, device tracking; pantallas Angular de auth (mobile first) | Suite de seguridad de auth en CI; flujo completo usable en staging | 3 sem |
| **3** | Multi-tenant | Entidades Tenancy; resolución de tenant (claim/subdominio/slug); filtros globales EF + **RLS activo**; onboarding de barbería (wizard); roles por membresía; seed de planes | Tests de fuga cross-tenant en CI; crear barbería end-to-end | 2 sem |
| **4** | Agenda | Barberos, horarios semanales con vigencia, bloqueos, festivos CO; cálculo de disponibilidad; UI de agenda del panel (móvil primero) | Disponibilidad correcta contra casos de borde de TZ/festivos (tests) | 3 sem |
| **5** | Reservas | Booking público en `barberos.com/{slug}`; crear/cancelar/reagendar; constraint anti doble-reserva; idempotencia; `appointment_history`; **penalizaciones** (PenaltyPolicy configurable por tenant, PenaltyRecord/History/Waiver, precio recargado mostrado antes de confirmar); **política de no-show** (NoShowPolicy/Record/History, tolerancia, recargo incrementado, bloqueos temporal/permanente, perdón — ADR-012); estados y eventos de dominio + outbox persistiendo | Flujo reserva→cancelar (con penalización)→reagendar E2E (Playwright) en CI; carrera de doble reserva probada; casos de borde de penalización y no-show cubiertos por tests de dominio | 4 sem |
| **6** | Clientes | CRM: fichas, búsqueda, walk-ins, fusión de duplicados, historial, no-shows, **clientes penalizados/bloqueados, perdón de penalizaciones y de faltas, gestión de bloqueos**; consentimiento de datos | Panel de clientes completo en móvil 320px | 2 sem |
| **7** | WhatsApp | Worker de outbox + `INotificationProvider`/`IWhatsappProvider` (Meta Cloud API); plantillas aprobadas; confirmación/recordatorios/cancelación; webhooks de estado; reintentos + dead-letter; email como canal de respaldo | Reserva en staging dispara WhatsApp real trazable por correlation id | 3 sem |
| **8** | Suscripciones | Planes y límites efectivos (pipeline behavior); trial; ciclo de estados; suspensión solo-lectura; `subscription_history` | Límites de plan aplicados y probados; panel de suscripción del Owner | 2 sem |
| **9** | Pagos (solo suscripción SaaS) | `IPaymentProvider` + Wompi para cobrar la suscripción mensual (checkout, webhooks firmados, idempotencia); `payments/attempts/invoices/refunds`; reconciliación; reintentos de cobro y dunning básico. **Sin ningún flujo de pago de servicios de barbería** | Pago real en sandbox Wompi activa suscripción end-to-end | 3 sem |
| **10** | Métricas | KPIs del tenant (dashboard panel) y globales (SuperAdmin), incluidos los de cancelación/penalización; queries optimizadas/vistas; export CSV | Dashboard con los 16 KPIs definidos, p95 < 500ms | 2 sem |
| **11** | Observabilidad+ | GlitchTip/Sentry, Prometheus + Loki + Grafana + alertas; postgres_exporter; dashboards de negocio; pruebas de carga (k6) con datos sintéticos | Alertas activas y runbook de respuesta; informe de carga | 2 sem |
| **12** | Producción | Hardening final VPS; backups pgBackRest + drill de restore; dominio y TLS definitivos; pgBouncer; runbooks completos; revisión de seguridad integral; beta cerrada con 3–5 barberías reales | Checklist go-live al 100%; primera barbería pagando | 2 sem |

**Total estimado: ~30 semanas** (7 meses) hasta producción con clientes reales.

## Notas de secuencia

- El orden Auth → Tenancy → Agenda → Reservas es deliberado: cada fase consume la anterior y las reservas (corazón del producto) llegan con la fundación de seguridad y aislamiento ya probada.
- WhatsApp (F7) va después de reservas pero antes de pagos: es el diferenciador de adopción para las barberías; cobrar (F9) sin recordatorios funcionando vende peor.
- El registro WABA en Meta (verificación de negocio, aprobación de plantillas) tarda semanas: **se inicia administrativamente durante la Fase 4**, en paralelo.
- Lanzamiento beta (post F9) es viable cobrando manualmente si Wompi se atrasa — el roadmap permite ese desvío sin bloquear.
