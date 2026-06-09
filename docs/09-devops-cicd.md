# 09 — DevOps y CI/CD

## 1. Entornos

| Entorno | Dónde | Propósito |
|---------|-------|-----------|
| `dev` | máquina local (Docker Compose) | desarrollo diario; PostgreSQL + MinIO + MailHog locales |
| `staging` | VPS (compose project separado, subdominio `staging.`) | validación pre-producción con datos sintéticos |
| `prod` | VPS Ubuntu Server | producción |

Paridad: misma imagen Docker en staging y prod; solo cambian variables de entorno.

## 2. Topología del VPS (v1)

```
Ubuntu Server (hardening: ufw, fail2ban, ssh sin password, usuario no-root)
└── Docker Engine
    ├── nginx            # único contenedor expuesto (80/443). TLS Let's Encrypt,
    │                    # proxy a frontend/api, rate limit grueso, gzip/brotli
    ├── frontend         # nginx interno sirviendo estáticos Angular
    ├── api              # ASP.NET Core (réplicas: 1 → N)
    ├── worker           # mismo build de api, perfil worker (outbox, recordatorios)
    ├── postgres         # volumen dedicado; SOLO en red interna, puerto no publicado
    └── (futuro) redis / loki / prometheus / grafana / glitchtip
```

- Redes Docker separadas: `edge` (nginx⇄frontend/api) y `data` (api/worker⇄postgres). PostgreSQL nunca está en `edge` ni publica puertos al host.
- Volúmenes nombrados para datos (`pg_data`, certificados); bind mounts solo para configuración.
- Recursos acotados por contenedor (`mem_limit`, `cpus`) para que un componente no tumbe al VPS.

## 3. Imágenes Docker (diseño; se implementan en Fase 1)

- API: multi-stage (sdk → runtime `mcr` chiseled/alpine), non-root, `HEALTHCHECK` apuntando a `/health/live`, imagen final < 120MB objetivo.
- Frontend: build Angular → nginx alpine sirviendo estáticos con cache-busting por hash.
- Tags: `ghcr.io/gnmoiso/barberos-api:{git-sha}` + alias `:vX.Y.Z` en release. **Nunca desplegar `latest`** — siempre sha o tag inmutable (rollback determinista).

## 4. Configuración y secretos

- 12-factor: toda configuración por variables de entorno; `.env` por entorno en el VPS (permisos 600, fuera de git) + `.env.example` versionado y siempre actualizado.
- Validación de configuración al arranque (fail-fast si falta una variable) — errores de despliegue se detectan en segundos, no en runtime.

## 5. Pipeline CI/CD (GitHub Actions — diseño)

**CI en cada PR (gate obligatorio):**
1. Restore + build backend (warnings as errors).
2. Tests unitarios Domain/Application.
3. Tests de integración (PostgreSQL en service container vía Testcontainers) — incluye la suite de fuga cross-tenant.
4. Lint + build frontend + tests.
5. Escaneo: dependencias vulnerables (dotnet list/`npm audit`/Dependabot) + secret scanning.

**CD (push a `main` → staging; tag `v*` → prod, con aprobación manual):**
1. Build de imágenes y push a GHCR.
2. Deploy por SSH: `docker compose pull && docker compose up -d --no-deps api worker frontend` (rolling por servicio, sin tocar postgres).
3. **Migraciones**: paso explícito y separado del arranque de la API (job one-shot `migrator` con la misma imagen), ejecutado antes del switch de versión. Las migraciones deben ser **compatibles hacia atrás** (expand → migrate → contract) para permitir rollback de la app sin rollback de BD.
4. Smoke test post-deploy: `/health/ready` + flujo de login sintético; si falla → rollback automático a la imagen anterior (sha previo registrado).

## 6. Reglas operativas (no negociables)

- **PROHIBIDO `docker compose down -v` en staging/prod** — los scripts de despliegue jamás incluyen `down`; solo `pull` + `up -d`. El acceso a comandos destructivos requiere intervención humana deliberada con doble confirmación.
- Backup verificado **antes** de cualquier migración en prod (gate del pipeline).
- Nada de cambios manuales en el VPS fuera de los scripts versionados en `deploy/` (drift = incidente).
- `restart: unless-stopped` en todos los servicios; logging driver `json-file` con rotación (`max-size`, `max-file`).
- Renovación de certificados automatizada y monitoreada (alerta a < 15 días).

## 7. Despliegue y rollback

- Estrategia v1: rolling por servicio en un VPS (corte de milisegundos con `up -d --no-deps`). Blue-green real (dos compose projects + switch en nginx) se introduce cuando haya réplicas múltiples (Fase 12+).
- Rollback = redeploy del sha anterior (las imágenes inmutables lo hacen trivial) + BD intacta gracias a migraciones expand/contract.
- Runbook de despliegue y de rollback versionados en `deploy/runbooks/` desde la Fase 1.
