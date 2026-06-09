# 02 — Estrategia Multi-Tenant

Requisito: cada barbería es un tenant; sus datos jamás pueden mezclarse con los de otra; el diseño debe soportar miles de barberías.

## 1. Análisis comparativo

### Opción A — Base de datos única, `TenantId` en todas las tablas (pool)

| Criterio | Evaluación |
|----------|------------|
| **Costo** | ★★★★★ Un solo servidor PostgreSQL, un pool de conexiones, un backup. Costo marginal por tenant ≈ 0. |
| **Rendimiento** | ★★★★☆ Excelente con índices compuestos `(tenant_id, …)`. Riesgo de *noisy neighbor* mitigable con rate limiting por tenant y, a futuro, particionado. |
| **Complejidad** | ★★★★★ Una sola migración, un solo esquema, una sola cadena de conexión. El riesgo real es el descuido humano (olvidar el filtro) — se mitiga con filtros globales + RLS. |
| **Mantenimiento** | ★★★★★ Migraciones se aplican una vez. Monitoreo y tuning sobre una sola base. |
| **Escalabilidad** | ★★★★☆ Miles de tenants pequeños caben con holgura. PostgreSQL maneja tablas de cientos de millones de filas con índices y particionado adecuados. |

### Opción B — Schema por tenant

| Criterio | Evaluación |
|----------|------------|
| **Costo** | ★★★★☆ Mismo servidor, pero el catálogo de PostgreSQL crece con cada schema. |
| **Rendimiento** | ★★★☆☆ Bien hasta cientos de schemas; con miles, el planner, `pg_dump`, autovacuum y la caché de relaciones se degradan. |
| **Complejidad** | ★★☆☆☆ Cada migración debe ejecutarse N veces; el control de versión de esquema por tenant es una fuente clásica de drift. EF Core no soporta esto de forma natural. |
| **Mantenimiento** | ★★☆☆☆ Un despliegue con migración sobre 2.000 schemas puede tardar horas y fallar a la mitad. |
| **Escalabilidad** | ★★☆☆☆ Práctico hasta ~500 tenants; después es el peor de ambos mundos. |

### Opción C — Base de datos por tenant

| Criterio | Evaluación |
|----------|------------|
| **Costo** | ★☆☆☆☆ Conexiones, memoria, backups y monitoreo se multiplican por N. Inviable en un VPS con miles de tenants. |
| **Rendimiento** | ★★★★★ Aislamiento perfecto por tenant. |
| **Complejidad** | ★☆☆☆☆ Orquestar migraciones, provisión y connection routing para miles de BDs exige tooling dedicado. |
| **Mantenimiento** | ★☆☆☆☆ Backups, restore y observabilidad por mil. |
| **Escalabilidad** | ★★☆☆☆ Escala en aislamiento, no en operación. Solo tiene sentido para pocos tenants enormes o con requisitos regulatorios. |

## 2. Decisión

**Opción A (pool) con defensa en profundidad**, y una válvula de escape híbrida ([ADR-002](adr/ADR-002-multitenant-pool-rls.md)):

1. **`tenant_id` obligatorio** en toda tabla de negocio (parte de `BaseAuditableEntity`).
2. **Filtro global de EF Core** por `tenant_id` resuelto desde `ITenantContext` — primera línea de defensa, automática en cada query.
3. **Row Level Security de PostgreSQL** — segunda línea de defensa **independiente del ORM**: la conexión fija `SET app.tenant_id = '…'` al inicio de cada unidad de trabajo y las políticas RLS hacen imposible leer o escribir filas de otro tenant aunque el código de aplicación tenga un bug. El rol de aplicación **no** tiene `BYPASSRLS`.
4. **Índices compuestos** con `tenant_id` como primera columna en todos los índices de negocio.
5. **Ruta de evolución híbrida**: como toda consulta pasa por una connection factory tenant-aware, un tenant Enterprise puede migrarse a su propia base de datos en el futuro sin tocar el código de los módulos (solo el routing). No se implementa en v1; se diseña para no cerrarse la puerta.

Por qué no B ni C: con un objetivo de miles de barberías pequeñas (decenas de citas/día cada una), el problema dominante es **costo operativo y de mantenimiento**, no aislamiento de rendimiento. A gana en 4 de 5 criterios y su única debilidad (riesgo de fuga por bug) se neutraliza con RLS.

## 3. Resolución del tenant en cada request

Estrategia de URLs decidida en [ADR-008](adr/ADR-008-url-estrategia.md): página pública por ruta `barberos.com/{slug}`, panel privado único en `app.barberos.com` (sin slug). Orden de resolución (el primero que aplique):

1. **Claim `tenant_id` del JWT** — única fuente de verdad para usuarios autenticados de panel (barbero, admin barbería). La URL del panel jamás determina el tenant.
2. **Slug en ruta pública** `barberos.com/{slug}` — para la página de servicios/disponibilidad/reserva de cada barbería (lookup indexado sobre `tenants.slug`, namespace reservado para rutas de plataforma).
3. **Dominio propio del tenant** (Premium/Enterprise futuro, vía Cloudflare for SaaS) — resolución por header Host contra `tenants.custom_domain`.

Reglas:

- SuperAdmin opera **sin** tenant implícito; sus endpoints viven bajo `/api/v1/admin/**` con políticas propias y selección explícita de tenant auditada.
- Un cliente final tiene cuenta de plataforma (no pertenece a un tenant); su relación con cada barbería se materializa en el registro `Customer` de ese tenant (ver [03-modelo-datos](03-modelo-datos.md)).
- Si un request autenticado de panel llega sin tenant resoluble → `403` con ProblemDetails; nunca un default silencioso.
- `tenant_id` se incluye como propiedad en **todos** los logs estructurados.

## 4. Aislamiento adicional

- **Storage**: prefijo por tenant en el bucket (`tenants/{tenantId}/…`); las URLs firmadas se generan siempre validando pertenencia.
- **Rate limiting por tenant** además de por IP: un tenant abusivo no degrada a los demás.
- **Cifrado/llaves**: no se requiere llave por tenant en v1; si un Enterprise lo exige, la ruta híbrida (BD dedicada) lo cubre.
- **Pruebas obligatorias**: la suite de integración incluye tests de fuga cross-tenant (crear datos en tenant A, intentar leerlos autenticado en tenant B) como gate de CI permanente.

## 5. Conclusión definitiva (cierre de Fase 0)

> **La estrategia multi-tenant inicial de BarberOS es la Opción A: base de datos PostgreSQL única con `tenant_id` en toda tabla de negocio, filtros globales de EF Core y Row Level Security como segunda defensa.** Las opciones B (schema por tenant) y C (base por tenant) quedan formalmente descartadas para el lanzamiento; C sobrevive únicamente como ruta de evolución selectiva para tenants Enterprise. Decisión registrada en [ADR-002](adr/ADR-002-multitenant-pool-rls.md). Nada de esto es implícito ni revisable sin un ADR que reemplace al ADR-002.

### Justificación técnica (resumen ejecutivo)

El perfil de carga de BarberOS es miles de tenants pequeños (decenas de citas/día cada uno). En ese perfil, el factor dominante es el **costo operativo por tenant** (migraciones, backups, monitoreo, provisión), no el aislamiento físico de rendimiento. La Opción A reduce ese costo marginal a ~cero y su única debilidad real —una fuga por bug de aplicación— se neutraliza con dos mecanismos independientes (filtro ORM + RLS) más una suite de fuga cross-tenant como gate de CI.

### Costos estimados (infraestructura, orden de magnitud USD/mes)

| Escala | Opción A (elegida) | Opción B (schemas) | Opción C (BD/tenant) |
|--------|-------------------|--------------------|--------------------|
| 10 tenants | 40–60 (1 VPS 8GB) | 40–60 + horas de operación de migraciones ×N | 60–100 + provisión/backup por BD |
| 100 tenants | 60–100 (VPS 16–32GB + CDN) | 80–150 + drift de esquemas creciente | 300–800 (RAM por conexión/BD, backups ×100) |
| 1.000 tenants | 150–300 (app + DB dedicada + Redis) | inviable en la práctica (migraciones de horas, catálogo degradado) | 1.500–5.000 + tooling propio de orquestación |
| Costo marginal por tenant | **≈ 0** | bajo en infra, alto en horas de ingeniería | 1.5–5 USD/tenant/mes |

(El costo dominante de B y C no es el hardware: son las horas de ingeniería y el riesgo operativo de gestionar N esquemas/bases.)

### Riesgos aceptados de la Opción A y su mitigación

| Riesgo | Mitigación |
|--------|------------|
| Fuga cross-tenant por bug | RLS independiente del ORM + tests de fuga en CI + revisión obligatoria de PRs de tenancy |
| Noisy neighbor | Rate limiting por tenant; límites de plan; ruta híbrida para tenants pesados |
| Restauración granular por tenant no es física | Procedimiento lógico documentado y ensayado ([10-backups-dr](10-backups-dr.md) §3) |
| RLS + PgBouncer (transaction pooling) | `SET app.tenant_id` por transacción, diseñado así desde Fase 3 |

### Estrategia de migración futura (ruta híbrida, ya diseñada)

Cuando un tenant Enterprise exija aislamiento físico (contrato, regulación o >5% de la carga total):

1. Provisionar BD dedicada (mismo esquema, misma versión de migraciones).
2. Exportar el grafo de datos del tenant con el script de restauración por tenant (idéntico al de DR — se ensaya mensualmente).
3. Ventana de mantenimiento breve para el tenant (su tráfico es predecible) con corte de escrituras.
4. Actualizar el routing en la connection factory tenant-aware (un registro de configuración; cero cambios en módulos).
5. Verificación de integridad y purga diferida de sus filas en la base pool.

El código nunca sabe en qué base vive un tenant: esa indirección se construye en Fase 3 y es la póliza de seguro de esta decisión.
