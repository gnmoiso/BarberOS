# 05 — Estrategia de seguridad

Objetivo de referencia: OWASP ASVS nivel 2 para los módulos de auth, pagos y datos personales.

## 1. Autenticación

- **Access token JWT**: vida corta (10–15 min), firmado con clave asimétrica (RS256/ES256 — permite validar en otros servicios futuros sin compartir secreto). Claims mínimos: `sub`, `tenant_id` (si aplica), `roles`, `jti`, `device_id`.
- **Refresh tokens con rotación y familias**:
  - Token opaco de alta entropía; en BD solo su **hash SHA-256**.
  - Cada uso emite un token nuevo y marca el anterior como `used_at` (rotación).
  - **Detección de reutilización**: si llega un token ya usado → se revoca la **familia completa** (posible robo) y se registra evento de seguridad + notificación al usuario.
  - Vida: 30 días deslizantes, máximo absoluto 90 días.
  - Revocación: por sesión, por dispositivo, o global ("cerrar sesión en todos los dispositivos").
- **Contraseñas**: Argon2id (fallback PBKDF2-SHA256 con parámetros OWASP si el hosting lo exige); política: ≥ 10 caracteres, chequeo contra diccionario de contraseñas filtradas; sin rotación forzada.
- **Verificación de email** obligatoria para panel de barbería; para clientes, requerida antes de la primera reserva (o verificación por WhatsApp OTP — decisión de producto en Fase 2).
- **Password reset**: token de un solo uso, hasheado en BD, vida 30 min, invalida sesiones activas opcionales; respuesta idéntica exista o no el email (no enumeración de cuentas).

## 2. Fuerza bruta y bots

- Lockout progresivo por cuenta: 5 fallos → 1 min, luego backoff exponencial hasta 15 min (`failed_login_count`, `locked_until`).
- Rate limiting por IP y por cuenta en `/auth/**` (políticas estrictas, ver §4).
- Cloudflare Turnstile (o equivalente) en registro, login tras 2 fallos y password reset.
- Honeypot field + tiempo mínimo de formulario en el booking público.
- `login_history` append-only con IP, user agent y resultado; alerta al usuario ante login desde dispositivo nuevo (`user_devices`).

## 3. Autorización

- Políticas por rol + tenant en cada endpoint (nunca confiar en el `tenant_id` del body/query: siempre del token o del contexto resuelto).
- Chequeo de pertenencia a nivel de recurso (IDOR): toda carga por id valida tenant vía filtro global EF + RLS (defensa doble).
- Límites de plan como política transversal (pipeline behavior).
- Endpoints SuperAdmin bajo `/api/v1/admin/**`, política dedicada, auditoría reforzada y (futuro) allowlist de IP.

## 4. Rate limiting (v1, in-process — ver ADR-004)

| Ámbito | Política inicial |
|--------|------------------|
| `/auth/login`, `/auth/register` | 5/min por IP, 20/h por IP |
| `/auth/refresh` | 10/min por usuario |
| Booking público | 30/min por IP + 300/h por tenant |
| API autenticada | 120/min por usuario; 1.000/min por tenant |
| Webhooks externos | allowlist de firma, sin límite por IP del proveedor |

Nginx aporta una capa L7 gruesa adicional (límite global de conexiones/req por IP).

## 5. Cabeceras y transporte

- TLS 1.2+ (Let's Encrypt, renovación automática), HSTS con preload.
- CSP estricta para el frontend (sin `unsafe-inline`; hashes/nonces para lo inevitable de Angular), `frame-ancestors 'none'`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` mínima.
- CORS: allowlist explícita de orígenes propios; nunca `*` con credenciales.
- Cookies (si se usa cookie para refresh token en frontend web): `HttpOnly; Secure; SameSite=Strict`, scope al path de refresh. **Decisión de diseño: refresh token en cookie HttpOnly, access token en memoria del SPA** (nunca localStorage).

## 6. Webhooks y secretos

- Verificación de firma en todos los webhooks (Wompi: events secret; Meta: app secret HMAC). Rechazo y log de firmas inválidas.
- Secretos: `.env` fuera del repo en v1 con permisos 600 y plantilla `.env.example`; migración a SOPS-age o Vault en fase de crecimiento. Prohibido cualquier secreto en el repositorio o en imágenes Docker.
- Rotación documentada de: claves JWT (kid + ventana de doble validación), secretos de webhook, credenciales de BD.

## 7. Aplicación

- Validación de entrada en el borde (FluentValidation) + invariantes en dominio.
- EF Core parametriza todo; SQL crudo solo parametrizado (regla de revisión de código).
- Subidas de archivos: validación de tipo real (magic bytes), tamaño máximo, reescritura de nombre, almacenamiento fuera del host (R2), URLs firmadas con expiración.
- Logs sin datos sensibles: nunca tokens, contraseñas ni payloads de tarjetas (los datos de tarjeta **jamás** tocan nuestro backend: checkout del proveedor — alcance PCI mínimo, SAQ-A).

## 8. Datos personales (Colombia — Ley 1581/2012)

- Registro de consentimiento (qué, cuándo, versión de política) para clientes y tenants.
- Derecho de supresión: anonimización de `customers`/`users` (hash irreversible de PII, conservación de hechos transaccionales sin identidad) — compatible con soft delete y auditoría.
- Minimización: solo se piden los datos que los módulos usan.
- Preparado para expansión: el modelo de consentimiento y residencia de datos se revisa por país antes de abrir mercado.

## 9. Auditoría de seguridad

- Eventos de seguridad de primera clase en `audit_logs` + log estructurado con severidad: login fallido repetido, reutilización de refresh token, cambio de contraseña, cambio de rol, acceso SuperAdmin a un tenant, firma de webhook inválida.
- Revisión: `/security-review` (análisis estático del diff) como paso de CI en cada PR que toque auth, pagos o tenancy.
