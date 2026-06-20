using System.Diagnostics;
using BarberOS.API.Hubs;
using BarberOS.API.Identity;
using BarberOS.API.Middleware;
using BarberOS.Application;
using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Identity;
using BarberOS.Infrastructure;
using BarberOS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
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
    builder.Services.AddSignalR();

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "BarberOS API", Version = "v1" });
    });

    builder.Services.AddCors(options =>
        options.AddPolicy("Dev", policy =>
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials())); // SignalR's client negotiates with credentials by default

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

    if (app.Environment.IsDevelopment())
    {
        app.UseCors("Dev");
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BarberOS API v1"));
    }

    app.UseStaticFiles(); // serves /uploads/** (avatars, post images) from wwwroot

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
    app.MapHub<AppointmentsHub>("/hubs/appointments");

    await SeedSuperAdminAsync(app);

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

static async Task SeedSuperAdminAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    await db.Database.MigrateAsync();

    const string superAdminEmail = "admin@barberos.io";
    if (!await db.Users.AnyAsync(u => u.Email == superAdminEmail))
    {
        var hash = hasher.Hash("SuperAdmin1234!");
        var user = User.Create(superAdminEmail, "BarberOS Admin", hash, isSuperAdmin: true);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        Log.Information("SuperAdmin seeded: {Email}", superAdminEmail);
    }
}

/// <summary>Exposes the entry point to WebApplicationFactory-based integration tests.</summary>
public partial class Program;
