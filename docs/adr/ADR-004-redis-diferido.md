# ADR-004 — Redis diferido: no forma parte de la v1

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

Se pidió analizar Redis para refresh tokens, rate limiting, caché, métricas y sesiones, y justificar si debe existir desde la primera versión.

## Análisis por caso de uso (v1 = 1 VPS, 1 réplica de API)

| Caso | ¿Necesita Redis en v1? | Solución v1 |
|------|------------------------|-------------|
| Refresh tokens | No — requieren durabilidad y auditoría; Redis ni siquiera es el lugar correcto | PostgreSQL (`refresh_tokens`, hash + familias) |
| Rate limiting | No — con una sola réplica, el rate limiter in-process de ASP.NET Core es exacto | Middleware nativo + capa gruesa en Nginx |
| Caché | No — `HybridCache` con backend in-memory; la interfaz ya admite L2 distribuido | In-memory con invalidación por eventos |
| Sesiones | No existen — API stateless por diseño (JWT) | — |
| Métricas/colas | No — outbox en PostgreSQL con `SKIP LOCKED` soporta múltiples consumidores | PostgreSQL |

## Decisión

**Sin Redis en v1.** Cada componente que lo necesitaría a futuro se programa contra abstracciones (`HybridCache`, `RateLimiter` policies, outbox) de modo que enchufar Redis sea configuración + un proveedor, no un refactor.

**Triggers medibles para introducirlo** (cualquiera dispara la adopción, estimado en etapa de ~1.000 barberías):

1. Segunda réplica de la API (rate limiting y caché deben ser compartidos).
2. p95 de cálculo de disponibilidad > 300ms con caché in-memory ya optimizada.
3. Hit ratio de caché degradado por reinicios frecuentes de despliegue.

## Consecuencias

- (+) Una pieza menos que operar, monitorear, respaldar y asegurar durante el año más frágil del proyecto.
- (+) Decisión reversible por diseño y con criterios objetivos de reversión.
- (−) Al escalar a réplicas hay una tarea pendiente conocida; está planificada en [11-escalabilidad](../11-escalabilidad.md) etapa 3.
