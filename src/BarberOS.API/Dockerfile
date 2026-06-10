# Multi-stage build (docs/09-devops-cicd.md §3). Build context: repository root.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

COPY Directory.Build.props ./
COPY src/BarberOS.Domain/BarberOS.Domain.csproj src/BarberOS.Domain/
COPY src/BarberOS.Application/BarberOS.Application.csproj src/BarberOS.Application/
COPY src/BarberOS.Infrastructure/BarberOS.Infrastructure.csproj src/BarberOS.Infrastructure/
COPY src/BarberOS.API/BarberOS.API.csproj src/BarberOS.API/
RUN dotnet restore src/BarberOS.API/BarberOS.API.csproj

COPY src/ src/
RUN dotnet publish src/BarberOS.API/BarberOS.API.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN adduser --disabled-password --gecos "" --uid 10001 appuser
USER appuser

COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Health probing is defined at the orchestrator level (compose) against /health/live;
# the base image ships no curl/wget and we keep it that way (smaller attack surface).

ENTRYPOINT ["dotnet", "BarberOS.API.dll"]
