# ADR-006 — Storage de archivos: Cloudflare R2 (prod) + MinIO (dev) vía IStorageProvider

**Estado:** Aceptado · **Fecha:** 2026-06-09

## Contexto

Logos, branding, fotos de perfil y archivos futuros. Requisitos: no almacenar binarios en PostgreSQL, proveedor intercambiable (S3, R2, MinIO), costo bajo, CDN cercana al usuario colombiano.

## Decisión

- Contrato `IStorageProvider` (upload, delete, signed URL con expiración) con implementación única **S3-compatible** — un solo código cubre R2, S3 y MinIO cambiando endpoint/credenciales.
- **Producción: Cloudflare R2** — egreso gratuito (las imágenes públicas de barberías se sirven mucho), integración natural con la CDN/DNS de Cloudflare ya prevista, costo ~USD 0.015/GB-mes.
- **Desarrollo y staging: MinIO** en Docker Compose — paridad total sin costo ni red.
- Convenciones: claves `tenants/{tenantId}/{categoria}/{uuid}.{ext}`; validación de magic bytes y tamaño; URLs firmadas para todo lo no público; assets públicos detrás de CDN con cache largo + invalidación por versión de clave.

## Alternativas descartadas

- **S3**: excelente pero cobra egreso — el caso de uso (imágenes públicas servidas constantemente) lo penaliza.
- **MinIO en el VPS para prod**: convierte archivos en estado del VPS (backup, disco, DR) — exactamente lo que queremos evitar.
- **PostgreSQL bytea**: prohibido por requisito y por sentido común (infla backups y WAL).

## Consecuencias

- (+) VPS sin estado de archivos; DR más simple; costo cercano a cero al inicio.
- (+) Cambiar de proveedor = cambiar configuración.
- (−) Dependencia de Cloudflare; mitigada por compatibilidad S3 total del código y export trivial de bucket.
