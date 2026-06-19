using System.Diagnostics;
using BarberOS.API.Identity;
using BarberOS.API.Middleware;
using BarberOS.Application;
using BarberOS.Application.Abstractions;
using BarberOS.Infrastructure;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;
using Serilog.Formatting.Compact;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("application", "barberos-api")
        .Enrich.WithProperty("environment", context.HostingEnvironment.EnvironmentName)
        .WriteTo.Console(new CompactJsonFormatter()));

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    // Override NullCurrentUser with the real HTTP-context-aware implementation.
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUser, ClaimsCurrentUser>();

    builder.Services.AddControllers();

    builder.Services.AddCors(options =>
        options.AddPolicy("Dev", policy =>
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()));

    // RFC 7807 for every error response; traceId is always correlatable with logs
    // (docs/06-api-standards.md §3).
    builder.Services.AddProblemDetails(options =>
        options.CustomizeProblemDetails = context =>
        {
            context.ProblemDetails.Extensions["traceId"] =
                Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
        });

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlerMiddleware>();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment()) app.UseCors("Dev");

    app.UseAuthentication();
    app.UseMiddleware<TenantResolutionMiddleware>();
    app.UseAuthorization();

    // Liveness: process responds. Readiness: dependencies (PostgreSQL) reachable.
    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false
    });
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = registration => registration.Tags.Contains("ready")
    });

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "BarberOS API terminated unexpectedly during startup");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>Exposes the entry point to WebApplicationFactory-based integration tests.</summary>
public partial class Program;
