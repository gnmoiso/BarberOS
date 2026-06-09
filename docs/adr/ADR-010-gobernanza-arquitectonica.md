# ADR-010 — Gobernanza arquitectónica: autoridad de cuestionamiento y trazabilidad de decisiones

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

BarberOS se diseña con un rol de arquitecto/CTO activo. El product owner estableció que las reglas de gobernanza del proyecto deben estar documentadas dentro del repositorio —no en acuerdos informales— para que sobrevivan a cambios de personas y herramientas.

## Decisión

### 1. Autoridad de cuestionamiento

> El arquitecto del proyecto tiene autorización para cuestionar requisitos funcionales, técnicos o de negocio cuando detecte:
>
> - riesgos de seguridad
> - riesgos legales
> - problemas de escalabilidad
> - inconsistencias funcionales
> - costos innecesarios
> - alternativas significativamente superiores
>
> Toda modificación estructural deberá quedar justificada mediante un ADR **antes** de ser adoptada.

Reglas de estado: si el cuestionamiento contradice un mandato explícito del product owner, el ADR nace en estado **Propuesto** y no se adopta hasta aprobación (precedente: [ADR-003](ADR-003-dotnet-10-lts.md)). Si la decisión está dentro del ámbito delegado al arquitecto, nace **Aceptado** (precedente: [ADR-008](ADR-008-url-estrategia.md)).

### 2. Trazabilidad de cambios importantes

- Todo cambio arquitectónico relevante queda registrado en un ADR numerado y secuencial en `docs/adr/`; los ADRs no se borran ni se editan para cambiar su sentido — se **reemplazan** por uno nuevo que los referencia (`Reemplaza` / `Reemplazado por`).
- Cada ADR debe declarar los **requisitos afectados** (sección *Contexto* citando el requisito de negocio o documento de origen) y enlazar los documentos que modifica.
- Los commits de documentación son atómicos y descriptivos (`docs: ...`), de modo que `git log -- docs/adr/` sea la línea de tiempo de decisiones del proyecto.

### 3. Propagación de impacto

Cuando una decisión arquitectónica modifica el alcance, en el **mismo cambio** se actualizan como mínimo:

| Si la decisión afecta… | Se actualiza… |
|---|---|
| Alcance funcional o fases | [12-roadmap](../12-roadmap.md) |
| Entidades, relaciones o índices | [03-modelo-datos](../03-modelo-datos.md) (incluido el diagrama ER) |
| Reglas de negocio o módulos | [04-dominio-y-modulos](../04-dominio-y-modulos.md) |
| Riesgos nuevos o mitigados | [13-riesgos](../13-riesgos.md) |
| Decisiones clave del proyecto | Tabla de decisiones del [README](../../README.md) |

Un ADR que requiera estas actualizaciones y no las incluya se considera incompleto y no debe mergearse.

## Consecuencias

- (+) Las decisiones y sus porqués sobreviven en el repositorio; cualquier persona (o agente) nueva reconstruye el razonamiento completo desde `docs/adr/`.
- (+) Los desacuerdos requisito-vs-arquitectura tienen un mecanismo formal de resolución en lugar de cambios silenciosos.
- (−) Pequeña fricción administrativa por cambio estructural; es el costo deliberado de la trazabilidad.
