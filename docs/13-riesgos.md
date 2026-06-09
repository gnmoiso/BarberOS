# 13 — Riesgos y mitigaciones

Escala: Probabilidad (P) e Impacto (I) en Bajo / Medio / Alto.

## Riesgos técnicos

| Riesgo | P | I | Mitigación |
|--------|---|---|------------|
| Fuga de datos cross-tenant por bug de aplicación | M | **A** | Defensa doble (filtros EF + RLS); suite de fuga cross-tenant como gate permanente de CI; revisión obligatoria de todo PR que toque tenancy |
| Doble reserva bajo concurrencia | M | A | Constraint `EXCLUDE` en BD (no solo validación de app); test de carrera en CI |
| .NET 9 sin soporte (EOL 12-may-2026) | **A** | A | Resuelto: .NET 10 LTS desde Fase 1 + política solo-LTS ([ADR-011](adr/ADR-011-estrategia-versiones.md)) |
| Migraciones EF destructivas en prod | M | A | Política expand→migrate→contract; migrador como job separado; backup verificado pre-migración (gate de pipeline) |
| Deuda por acoplamiento entre módulos | M | M | Reglas de dependencia verificadas (ArchUnit.NET en CI); comunicación entre módulos solo por contratos/eventos |
| Pérdida de notificaciones (citas sin recordatorio) | M | M | Outbox transaccional + reintentos + dead-letter visible en panel; alerta de outbox atascado |

## Riesgos de escalabilidad

| Riesgo | P | I | Mitigación |
|--------|---|---|------------|
| Noisy neighbor (un tenant degrada a los demás) | M | M | Rate limiting por tenant; límites de plan; ruta híbrida a BD dedicada para tenants grandes |
| Crecimiento de tablas append-only degrada la BD | A (a largo plazo) | M | Particionado mensual planificado; archivado a storage frío; índices parciales |
| VPS único como cuello de botella | M | M | Diseño stateless listo para réplicas; plan de etapas con señales medibles ([11-escalabilidad](11-escalabilidad.md)) |

## Riesgos de seguridad

| Riesgo | P | I | Mitigación |
|--------|---|---|------------|
| Robo de refresh tokens | M | A | Rotación + detección de reutilización por familia; cookie HttpOnly; revocación global |
| Credential stuffing / fuerza bruta | A | M | Lockout progresivo, rate limiting, Turnstile, password breach check, alertas de login anómalo |
| Webhooks falsificados (pagos "aprobados" falsos) | M | **A** | Verificación de firma obligatoria; el estado del pago se confirma contra el proveedor, nunca solo por webhook entrante |
| Compromiso del VPS (incluye ransomware) | B | **A** | Hardening + fail2ban + actualizaciones; backups off-site **inmutables** (object-lock); secretos rotables; DR drill trimestral |
| Exposición de PII (Ley 1581) | M | A | Minimización, consentimiento registrado, anonimización para supresión, logs sin PII |

## Riesgos de costos

| Riesgo | P | I | Mitigación |
|--------|---|---|------------|
| Costo por conversación de WhatsApp crece con adopción | A | M | Costo modelado en el precio de los planes; recordatorios consolidados (1 conversación por cita); monitoreo de costo por tenant |
| Comisiones de pasarela + impuestos comprimen margen | M | M | Precio de planes con margen calculado post-comisión Wompi (~2.65%+IVA); revisión trimestral |
| Sobre-ingeniería temprana (Redis, k8s, microservicios) | M | M | ADRs con triggers medibles para cada pieza de infraestructura; regla "scale-up primero" |

## Riesgos operativos

| Riesgo | P | I | Mitigación |
|--------|---|---|------------|
| Aprobación WABA/plantillas de Meta tarda semanas | **A** | A | Trámite iniciado en Fase 4 (en paralelo); email como canal de respaldo; SMS (Twilio) como contrato ya diseñado |
| Bus factor = 1 (equipo mínimo) | A | A | Todo en runbooks y ADRs; despliegue 100% automatizado; cero conocimiento solo-en-cabeza |
| Backup que nunca se probó no restaura | M | **A** | Drill de restore mensual automatizado + simulacro DR trimestral con RTO medido |
| Soporte a barberías no técnicas desborda al equipo | A | M | Onboarding guiado (wizard), plantillas precargadas, FAQ/video; dead-letter y errores visibles en panel para autodiagnóstico |
| Políticas punitivas mal calibradas (penalizaciones/bloqueos) ahuyentan clientes finales | M | M | Defaults conservadores y desactivadas por defecto; transparencia previa a la reserva; perdón manual siempre disponible; KPIs de cancelación/no-show para calibrar con datos |
| Dependencia de un solo proveedor de pagos | M | M | `IPaymentProvider` con Mercado Pago como segundo proveedor activable |

## Riesgo de producto (el mayor de todos)

| Riesgo | P | I | Mitigación |
|--------|---|---|------------|
| Construir 7 meses sin validación de mercado | M | **A** | Beta cerrada con 3–5 barberías reales desde la Fase 7 (reservas + WhatsApp funcionando, gratis); su feedback re-prioriza Fases 8–12; el roadmap permite cobrar manualmente antes de tener pagos automatizados |
