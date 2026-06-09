# ADR-003 — .NET 10 LTS en lugar de .NET 9

**Estado:** Reemplazado por [ADR-011](ADR-011-estrategia-versiones.md) (que formaliza .NET 10 LTS y la política de versiones completa) · **Fecha:** 2026-06-09

## Contexto

El mandato del proyecto fija ".NET 9". Sin embargo:

- .NET 9 es **STS** (Standard Term Support): su soporte terminó el **12 de mayo de 2026** — ya está fuera de soporte a la fecha de esta decisión. Lanzar un SaaS nuevo sobre un runtime sin parches de seguridad contradice la estrategia de seguridad del propio proyecto.
- **.NET 10 es LTS** (noviembre 2025 → noviembre 2028): cubre todo el roadmap (7 meses a producción) y más de dos años de operación con parches.
- El costo de adopción es nulo en un proyecto greenfield: API, EF Core y tooling son compatibles; nada de lo diseñado depende de .NET 9.

## Decisión

Usar **.NET 10 LTS** (SDK y runtime) desde la Fase 1 para API, Application, Domain, Infrastructure y tests. Todo lo demás del stack mandatado permanece igual.

## Consecuencias

- (+) Parches de seguridad garantizados hasta nov-2028; sin migración forzada a mitad del roadmap.
- (+) Acceso a mejoras de EF Core 10 y ASP.NET Core 10 (HybridCache maduro, OpenAPI nativo).
- (−) Desviación formal del mandato → este ADR queda en estado *Propuesto* hasta aprobación explícita; si se rechaza, se implementa en .NET 9 documentando el riesgo de EOL en [13-riesgos](../13-riesgos.md) y planificando upgrade inmediato post-MVP.
