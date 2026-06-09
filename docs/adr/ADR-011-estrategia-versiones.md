# ADR-011 — Estrategia de versiones de frameworks: .NET 10 LTS y política de actualización

**Estado:** Aceptado · **Fecha:** 2026-06-09 · **Resuelve y reemplaza** a [ADR-003](ADR-003-dotnet-10-lts.md) (que queda *Reemplazado*)

## Contexto

Existía discusión abierta entre el mandato original (.NET 9) y la recomendación del arquitecto (.NET 10 LTS). El product owner solicitó una decisión formal de versiones para evitar cambios de stack a mitad del desarrollo. Requisito afectado: "Stack tecnológico obligatorio — Backend .NET 9" del mandato de Fase 0; cuestionado bajo la autoridad de [ADR-010](ADR-010-gobernanza-arquitectonica.md) por riesgo de seguridad (runtime sin soporte).

## Decisión

### 1. Versión definitiva de .NET

**.NET 10 LTS** para todos los proyectos backend (API, Application, Domain, Infrastructure, tests) desde la Fase 1. Es la versión con la que BarberOS llega a producción; no se cambia de major durante el desarrollo del roadmap (Fases 1–12). **Decisión definitiva.**

#### Análisis de alternativas disponibles hoy (jun-2026) para iniciar desarrollo de producción inmediato

| Opción | Soporte | Veredicto |
|--------|---------|-----------|
| .NET 8 LTS | hasta **10-nov-2026** (~5 meses) | ❌ Expira a mitad del roadmap (~7 meses): obligaría a un upgrade de major en plena Fase 8–9, exactamente lo que esta política prohíbe |
| .NET 9 STS | **terminó 12-may-2026** | ❌ Sin parches de seguridad desde antes de la primera línea de código; descalificado |
| **.NET 10 LTS** | hasta **nov-2028** | ✅ Única opción que cubre desarrollo (7 meses) + ≥ 2 años de operación con soporte |

La elección no se basa en novedad: a la fecha, .NET 10 es la **única versión de .NET con soporte que sobrevive al roadmap**. Además ya no es una versión recién salida: lleva ~7 meses en GA (nov-2025) con múltiples parches mensuales 10.0.x acumulados — la fase de estabilización inicial ya ocurrió, lo que da el equilibrio buscado entre estabilidad, soporte, productividad, mantenimiento y escalabilidad.

#### Matriz de compatibilidad del ecosistema (verificada para arranque inmediato de Fase 1)

| Componente | Estado con .NET 10 | Nota |
|------------|--------------------|------|
| **EF Core 10** | ✅ GA junto con .NET 10 (nov-2025), mismo ciclo LTS hasta nov-2028 | Versión madura tras 7 meses de parches; soporta interceptores, filtros globales, `tstzrange` mapeado vía provider |
| **Npgsql + Npgsql.EntityFrameworkCore.PostgreSQL 10.x** | ✅ GA alineado al major de EF Core (el proveedor publica su major junto a cada EF Core) | Cubre los requisitos del diseño: `tstzrange`/NodaTime, RLS vía `SET`, exclusion constraints, COPY, UUIDv7 |
| **Docker** | ✅ Imágenes oficiales `mcr.microsoft.com/dotnet/sdk:10.0` y `aspnet:10.0` (incl. variantes chiseled/alpine) publicadas y mantenidas | Multi-stage build del diseño DevOps funciona sin cambios |
| **GitHub Actions** | ✅ `actions/setup-dotnet` soporta `10.0.x`; runners hosted lo incluyen | Pipeline CI/CD del diseño sin fricción |
| **Serilog, FluentValidation, MediatR, Testcontainers, OpenTelemetry** | ✅ Compatibles (target `net10.0` o netstandard) | Ecosistema mayor adoptó .NET 10 en los meses post-GA |

(Verificación operativa: la Fase 1 inicia con `dotnet --version` y restauración limpia de todos los paquetes anclados a sus majors 10.x; cualquier incompatibilidad residual se detectaría el primer día, con .NET 8 LTS como contingencia teórica — escenario considerado altamente improbable.)

#### Riesgos de actualización futura y su gestión

| Riesgo | Gestión |
|--------|---------|
| Upgrade obligatorio a .NET 12 LTS antes de nov-2028 | Planificado: ventana de adopción 6 meses post-release (nov-2027 → may-2028), entre fases, con los criterios de §4 — nunca forzado por EOL sorpresivo |
| Breaking changes de EF Core en majors futuros | El acceso a datos vive solo en Infrastructure (Clean Architecture): la superficie de impacto está acotada a un proyecto |
| Npgsql cambia comportamiento de tipos (precedente: timestamptz en Npgsql 6) | Convención ya alineada (todo UTC + `timestamptz`); tests de integración con PostgreSQL real (Testcontainers) detectan regresiones de provider |
| Imágenes base Docker deprecadas | Tags inmutables por digest + Dependabot sobre Dockerfiles |
| Angular major anual obligatorio por ventana de 18 meses | Política §3: un major a la vez, presupuestado ~1 semana cada 6 meses |

### 2. Política de actualización de .NET

- **Solo versiones LTS** (cadencia: una LTS cada 2 años). Las STS (.NET 11) se ignoran salvo necesidad puntual justificada por ADR.
- **Parches** (10.0.x): adopción mensual automática vía Dependabot/CI; parches de seguridad críticos, en menos de 1 semana.
- **Siguiente LTS** (.NET 12, nov-2027): adopción dentro de los **6 meses** posteriores al release, nunca antes de la versión 12.0.1+, siempre entre fases del roadmap (jamás a mitad de una fase) y precedida de rama de prueba con suite completa verde + soak en staging ≥ 1 semana.
- EF Core y paquetes Microsoft.* van siempre alineados al major de .NET en uso.

### 3. Política de actualización de Angular

- **Arranque: Angular 21** (vigente y soportado; ventana de soporte oficial de 18 meses por major).
- **Regla de soporte**: nunca operar en producción con un major de Angular fuera de su ventana LTS oficial.
- **Majors** (cadencia semestral): adopción de **un major a la vez** con `ng update` (sin saltos dobles), dentro de los 6 meses del release, esperando al menos la versión `.1`. Mismas condiciones que .NET: entre fases, suite E2E verde, soak en staging.
- **Minors y parches**: mensual vía Dependabot; TypeScript y TailwindCSS se actualizan junto con el major de Angular que los soporte.

### 4. Criterios obligatorios para cualquier upgrade mayor (ambos stacks)

1. La versión actual se acerca a fin de soporte (< 6 meses) **o** el upgrade aporta valor concreto documentado.
2. Auditoría de breaking changes contra el código propio antes de tocar nada.
3. Rama dedicada; CI completo + E2E verdes; despliegue a staging con soak ≥ 1 semana.
4. Ventana de rollback clara (imagen anterior desplegable; sin migraciones de BD acopladas al upgrade).
5. Registrado en el changelog del repositorio; si cambia comportamiento o arquitectura, ADR nuevo.

## Consecuencias

- (+) Cero ambigüedad de stack durante el desarrollo; ventanas de upgrade predecibles y presupuestables.
- (+) El proyecto nunca opera sobre runtime/framework sin parches de seguridad.
- (−) Renuncia a features de las STS de .NET hasta la siguiente LTS; costo aceptado por estabilidad.
- (→) [ADR-003](ADR-003-dotnet-10-lts.md) pasa a estado *Reemplazado por ADR-011*; README, [13-riesgos](../13-riesgos.md) y [00-fase0-checklist](../00-fase0-checklist.md) actualizados en este mismo cambio (regla de propagación de ADR-010).
