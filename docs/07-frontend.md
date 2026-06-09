# 07 — Frontend (Angular 21)

## 1. Decisiones base

- **Angular 21** con **standalone components**, **signals** (estado y formularios reactivos signal-based), **zoneless change detection** y control flow nativo (`@if/@for`).
- **TailwindCSS** + **design system propio** (sin dependencia obligatoria de Angular Material; si se usa algo, CDK headless únicamente).
- **Una sola aplicación** Angular con tres áreas lazy (decisión revisable en Fase 10+ si los bundles lo justifican); URLs según [ADR-008](adr/ADR-008-url-estrategia.md):
  - `booking` — sitio público de reservas por barbería en `barberos.com/{slug}`: el más crítico en performance móvil. Muestra servicios, disponibilidad, reserva, política de penalización y, si el cliente tiene penalización activa, el precio recargado con desglose antes de confirmar.
  - `panel` — barberos y administradores de barbería en `app.barberos.com` (tenant por JWT, nunca por URL): agenda, horarios, empleados, servicios y precios, clientes, sucursales, métricas, branding, política de penalización y suscripción.
  - `platform` — SuperAdmin en `app.barberos.com/platform`.

## 2. Estructura prevista

```
frontend/BarberOS.Frontend/src/app/
├── core/            # auth (token store en memoria), interceptors, guards,
│                    # api client base, error handler, config por entorno
├── shared/          # design system: ui/ (botones, inputs, modal, toast,
│                    # calendar, bottom-sheet), pipes, directivas, utils
├── features/
│   ├── booking/     # flujo público: barbería → servicio → barbero → slot → confirmar
│   ├── auth/        # login, registro, reset, verificación
│   ├── panel/
│   │   ├── agenda/  ├── appointments/  ├── services/  ├── customers/
│   │   ├── team/    ├── branches/      ├── metrics/   └── settings/
│   └── platform/    # tenants, planes, pagos, métricas globales
└── app.routes.ts    # lazy por feature, guards por rol
```

- **Guards**: `authGuard`, `roleGuard(roles)`, `tenantGuard`, `planFeatureGuard(feature)`.
- **Interceptors**: auth (access token + refresh silencioso con cola de reintentos), correlation-id, errores ProblemDetails → toast/estado por `errorCode`, loading.
- Estado: signals + servicios por feature; sin NgRx en v1 (complejidad no justificada; revisar si el panel crece).

## 3. Design system propio

- **Tokens primero**: colores, tipografía, espaciado, radios y sombras como CSS custom properties consumidas por Tailwind (`var(--color-primary)`), lo que habilita **branding por tenant** (plan Profesional+) cambiando tokens en runtime, sin recompilar.
- Componentes base v1: Button, Input, Select, DatePicker/Calendar (slots de agenda es componente propio crítico), Modal, BottomSheet (móvil), Toast, Card, Badge, Tabs, EmptyState, Skeleton.
- Accesibilidad: foco visible, contraste AA, targets táctiles ≥ 44px, labels reales.
- Dark mode preparado a nivel de tokens (no prioridad de v1).

## 4. Mobile first (no negociable)

- Diseño y desarrollo arrancan en **320px**; breakpoints de verificación: 320 / 375 / 390 / 414 / 428 px, luego tablet/desktop (Tailwind `sm/md/lg/xl`).
- El flujo de reserva pública se diseña como experiencia móvil: pasos cortos, bottom-sheets, teclados correctos (`inputmode`), botón de acción fijo inferior.
- Definition of Done de toda pantalla incluye captura/verificación en 320px y 390px. **El responsive no es una fase: es parte de cada PR.**
- Presupuestos de performance (booking público): LCP < 2.5s en 4G media, JS inicial < 200KB gz, imágenes AVIF/WebP con tamaños responsivos.
- PWA (instalable + offline básico de consulta) en el roadmap post-v1; SSR/hydration para el área `booking` se evalúa en Fase 10 por SEO de páginas públicas de barbería.

## 5. Calidad

- ESLint + Prettier + strict TypeScript (`strict: true`, `noUncheckedIndexedAccess`).
- Tests: unitarios de lógica (Vitest/Karma según tooling Angular 21) + Playwright E2E del flujo de reserva y login como smoke de CI.
- i18n: textos en español por defecto, arquitectura `@angular/localize`/Transloco-ready para expansión (decisión final en Fase 1; no hardcodear strings en componentes).
