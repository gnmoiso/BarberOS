# ADR-008 — Estrategia de URLs: ruta por slug para clientes, panel único para barberías

**Estado:** Aceptado · **Fecha:** 2026-06-09 · **Reemplaza** la resolución por subdominio descrita originalmente en [02-multi-tenant](../02-multi-tenant.md)

## Contexto

Cada barbería necesita una URL pública para que sus clientes vean servicios, disponibilidad y reserven, y un acceso administrativo privado. Opciones evaluadas:

- **A. Ruta en dominio raíz**: `barberos.com/barberia-la-elegancia`
- **B. Ruta en subdominio de app**: `app.barberos.com/barberia-la-elegancia`
- **C. Subdominio por tenant**: `barberia-la-elegancia.barberos.com` (+ `admin.barberia-la-elegancia.barberos.com`)

## Comparación

| Criterio | A — `barberos.com/{slug}` | B — `app.barberos.com/{slug}` | C — subdominio por tenant |
|---|---|---|---|
| **SEO** | ★★★★★ Toda página de barbería hereda y alimenta la autoridad del dominio raíz (modelo Booksy/Fresha). | ★★★☆☆ `app.` se trata como propiedad casi separada; el marketing del raíz no le transfiere autoridad plena. | ★★☆☆☆ Cada subdominio es tratado por buscadores como sitio cuasi-independiente: miles de subdominios con poco contenido = autoridad diluida. |
| **Experiencia de usuario** | ★★★★☆ URL corta, memorizable, fácil de dictar y poner en redes/WhatsApp. | ★★★☆☆ Igual de funcional, un nivel más larga. | ★★★★☆ Percepción de "sitio propio", pero más difícil de dictar y propensa a errores de escritura. |
| **Mantenimiento** | ★★★★★ Cero DNS/TLS extra: un certificado, una zona. | ★★★★★ Igual de simple. | ★★☆☆☆ Wildcard DNS + certificado wildcard. **Bloqueador técnico**: `*.barberos.com` **no cubre** `admin.{slug}.barberos.com` (los wildcard son de un solo nivel) → certificado por tenant o segundo esquema; automatización frágil. |
| **Multi-tenant (resolución)** | ★★★★★ Slug en ruta, trivial y explícito. | ★★★★★ Igual. | ★★★★☆ Resolución por header Host; correcta pero acopla tenancy a DNS. |
| **Escalabilidad** | ★★★★★ 10.000 tenants = 10.000 filas, cero objetos de infraestructura. | ★★★★★ Igual. | ★★★☆☆ 10.000 subdominios gestionables con wildcard, pero certificados/admin multiplican objetos operativos. |

## Decisión

1. **URL pública de clientes — Opción A**: `barberos.com/{slug}` (ej. `barberos.com/barberia-la-elegancia`).
   - Slug único global (citext, kebab-case, validado contra lista de rutas reservadas: `panel`, `api`, `admin`, `login`, `docs`, etc.).
   - El sitio de marketing vive en `barberos.com/` y convive con los slugs (namespace de primer nivel reservado primero para la plataforma).
2. **Panel privado de barbería — panel único en `app.barberos.com`** (sin slug en la URL):
   - El tenant **no** se deriva de la URL sino del **claim del JWT** tras login (selector de barbería si el usuario pertenece a varias).
   - Razones de seguridad: evita enumeración de paneles por slug, elimina toda posibilidad de confiar en un tenant declarado por URL, y separa el **origin** del panel del sitio público → cookies del refresh token y CSP del panel no se comparten con páginas públicas.
   - La forma `barberos.com/barbero/{slug}` se descarta: el slug no aporta nada (la membresía ya determina el tenant) y expone superficie de enumeración.
3. **Dominio propio por tenant** (`barberialaelegancia.com`) queda como feature Premium/Enterprise futura vía Cloudflare for SaaS (custom hostnames + TLS automático), compatible con esta decisión sin refactor.
4. SuperAdmin: `app.barberos.com/platform` (mismo origin del panel, políticas propias).

## Consecuencias

- (+) SEO concentrado en un dominio; operación TLS/DNS trivial; tenancy nunca confía en la URL para autorización.
- (+) La resolución pública por slug es un simple lookup indexado (`tenants.slug`).
- (−) Las barberías no tienen "subdominio propio"; mitigado por la futura opción de dominio propio, que es percepción de marca superior a un subdominio.
- (→) Actualiza el orden de resolución de tenant en [02-multi-tenant](../02-multi-tenant.md) §3.
