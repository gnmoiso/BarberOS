# Arranque local de desarrollo — BarberOS

Guía para levantar el entorno de desarrollo completo desde cero.
Tiempo estimado: 5 minutos en primera ejecución (descarga de imágenes Docker).

## Requisitos previos

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0.x | `dotnet --version` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 27.x | `docker version` |
| Git | cualquiera | `git --version` |

## Primer arranque

```bash
# 1. Clonar el repositorio
git clone git@github-barberos:gnmoiso/BarberOS.git
cd BarberOS

# 2. Crear el archivo de variables de entorno local
cp .env.example .env
# El .env del repo ya viene preconfigurado para desarrollo local (PostgreSQL en Docker).
# Editar solo si tus puertos 5432/9000/9001/1025/8025 ya están ocupados.

# 3. Levantar los servicios de infraestructura (PostgreSQL, MinIO, MailHog)
docker compose -f deploy/docker-compose.dev.yml up -d

# 4. Esperar a que PostgreSQL esté listo (~5 s)
docker compose -f deploy/docker-compose.dev.yml ps

# 5. Restaurar dependencias y lanzar la API
dotnet restore BarberOS.sln
dotnet run --project src/BarberOS.API
```

La API estará disponible en `http://localhost:5000` (HTTP) o `https://localhost:5001` (HTTPS).

## Verificación rápida

```bash
# Health liveness (sin dependencias externas — siempre debe retornar 200)
curl http://localhost:5000/health/live

# Health readiness (requiere PostgreSQL activo)
curl http://localhost:5000/health/ready

# Ejemplo con Correlation-Id propio
curl -H "X-Correlation-Id: mi-traza-123" http://localhost:5000/health/live -v
# → debe aparecer X-Correlation-Id: mi-traza-123 en los headers de respuesta
```

## Servicios disponibles en modo desarrollo

| Servicio | Puerto(s) | URL / acceso |
|---|---|---|
| **API BarberOS** | 5000 (HTTP) | `http://localhost:5000` |
| **PostgreSQL 17** | 5432 | `Host=localhost;Port=5432;Database=barberos;Username=barberos;Password=barberos_dev_only` |
| **MinIO** (S3-compatible) | 9000 (API) / 9001 (consola) | Consola: `http://localhost:9001` · Usuario: `barberos` · Pass: `barberos_dev_only` |
| **MailHog** (SMTP dev) | 1025 (SMTP) / 8025 (UI web) | Bandeja: `http://localhost:8025` |

## Comandos útiles del día a día

```bash
# Ver estado de contenedores
docker compose -f deploy/docker-compose.dev.yml ps

# Ver logs de PostgreSQL en tiempo real
docker compose -f deploy/docker-compose.dev.yml logs -f postgres

# Detener servicios (conserva datos en volúmenes)
docker compose -f deploy/docker-compose.dev.yml stop

# Reiniciar servicios
docker compose -f deploy/docker-compose.dev.yml start

# Eliminar contenedores sin borrar datos
docker compose -f deploy/docker-compose.dev.yml down

# ⚠️  Destruir datos (solo desarrollo — NUNCA en producción)
# docker compose -f deploy/docker-compose.dev.yml down -v
```

## Ejecutar tests

```bash
# Todos los tests (Unit + Integration)
dotnet test BarberOS.sln

# Solo una capa
dotnet test tests/BarberOS.Domain.Tests
dotnet test tests/BarberOS.Application.Tests
dotnet test tests/BarberOS.Api.IntegrationTests
```

Los integration tests en `BarberOS.Api.IntegrationTests` usan `WebApplicationFactory`
con connection string de test inyectada — no requieren Docker activo.

## Alias conveniente (opcional)

Añade a tu `~/.bashrc` o `~/.zshrc`:

```bash
alias barberos-up='docker compose -f deploy/docker-compose.dev.yml up -d'
alias barberos-down='docker compose -f deploy/docker-compose.dev.yml stop'
alias barberos-run='dotnet run --project src/BarberOS.API'
```

## Estructura de puertos y posibles conflictos

Si ya tienes PostgreSQL instalado localmente en el puerto 5432, cambia el mapeo
en `deploy/docker-compose.dev.yml`:

```yaml
ports:
  - "5433:5432"   # Expone en 5433 localmente
```

Y actualiza la variable en `.env`:

```
ConnectionStrings__Database=Host=localhost;Port=5433;...
```

## Notas de seguridad

- `.env` nunca se commitea (está en `.gitignore`). Contiene solo valores de desarrollo sin impacto en producción.
- Las contraseñas en `docker-compose.dev.yml` son exclusivas para desarrollo local; producción usa secretos gestionados por separado.
- Los datos de tarjeta jamás tocan el backend de BarberOS (ver `docs/adr/ADR-007-pagos-wompi.md`).
