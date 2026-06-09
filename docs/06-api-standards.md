# 06 — Estándares de API

## 1. Principios

- REST pragmático sobre HTTPS, JSON UTF-8, inglés en el contrato.
- Rutas en plural y kebab-case: `/api/v1/appointments`, `/api/v1/schedule-blocks`.
- La API pública del tenant (booking) y la del panel comparten versión y convenciones; los endpoints de plataforma viven bajo `/api/v1/admin/**`.

## 2. Versionado

- Por URL: `/api/v1/...`. Cambios incompatibles → `v2` conviviendo con `v1` durante un período de deprecación anunciado (header `Sunset` + changelog).
- Cambios aditivos (campos nuevos opcionales) no rompen versión; los clientes deben tolerar campos desconocidos.

## 3. Errores — RFC 7807 ProblemDetails

Toda respuesta de error usa `application/problem+json`:

```json
{
  "type": "https://docs.barberos.app/errors/double-booking",
  "title": "The selected time slot is no longer available.",
  "status": 409,
  "detail": "Barber 'Carlos' already has an appointment from 10:00 to 10:45.",
  "instance": "/api/v1/appointments",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "errorCode": "booking.double_booking"
}
```

- `errorCode` estable y documentado por dominio (`auth.invalid_credentials`, `plan.limit_exceeded`, `booking.outside_schedule`, …) — el frontend traduce por código, nunca parsea `detail`.
- Errores de validación: extensión `errors: { campo: [mensajes] }` (formato ValidationProblemDetails).
- 500 jamás filtra stack trace; siempre incluye `traceId` correlacionable con logs.

## 4. Paginación, orden y filtros

- **Paginación por página** (panel/admin): `?page=1&pageSize=20` (máx. 100). Respuesta envuelta:

```json
{ "items": [...], "page": 1, "pageSize": 20, "totalItems": 134, "totalPages": 7 }
```

- **Paginación por cursor** (listas grandes/infinite scroll, p. ej. historial): `?cursor=...&limit=20` con `nextCursor` opaco (UUIDv7 lo hace trivial). Se introduce donde el conteo total no aporta.
- **Orden**: `?sort=createdAt:desc,name:asc` — campos permitidos en allowlist por endpoint.
- **Filtros**: query params planos y tipados (`?status=Confirmed&from=2026-06-01&to=2026-06-30&barberId=...`). Sin lenguajes de filtro genéricos (OData/GraphQL descartados en v1).

## 5. Idempotencia

- Header `Idempotency-Key` (UUID del cliente) **obligatorio** en `POST` de reservas y de checkout de pagos; opcional en el resto de POST con efectos.
- Semántica: misma key + mismo payload → se devuelve la respuesta original (almacenada 24h); misma key + payload distinto → `422 idempotency.key_reuse`.
- Webhooks entrantes: idempotencia por `provider_event_id` persistido.

## 6. Convenciones adicionales

| Tema | Convención |
|------|------------|
| Fechas | ISO-8601 con offset (`2026-06-09T14:30:00-05:00`); la API acepta y devuelve UTC u offset explícito |
| IDs | UUID en string estándar |
| Dinero | `{ "amount": 35000, "currency": "COP" }` — entero en unidad mínima **no**: decimal con 2 posiciones (COP no usa centavos en práctica, pero el modelo es multi-moneda) |
| Enums | strings PascalCase estables (`"Confirmed"`), nunca números |
| Correlación | request acepta `X-Correlation-Id` (se genera si falta) y siempre lo devuelve; `traceId` W3C en errores |
| Health | `/health/live` (proceso vivo) y `/health/ready` (BD y dependencias) — sin auth, no expuestos por Nginx al público |
| OpenAPI | generado desde código, publicado por entorno en `/api/docs` (protegido fuera de dev) |
| Status codes | 200/201/204 éxito; 400 validación; 401/403 auth; 404 no existe **o no pertenece al tenant** (no se revela existencia); 409 conflicto (doble reserva, concurrencia); 422 semántico; 429 rate limit con `Retry-After` |
