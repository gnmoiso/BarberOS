using System.Text;
using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Infrastructure.Identity;
using BarberOS.Infrastructure.Persistence;
using BarberOS.Infrastructure.Persistence.Interceptors;
using BarberOS.Infrastructure.Repositories;
using BarberOS.Infrastructure.Time;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace BarberOS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Missing required connection string 'ConnectionStrings:Database'.");

        var jwtSecret = configuration["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(jwtSecret))
            throw new InvalidOperationException("Missing required configuration 'Jwt:Secret'.");

        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddScoped<ICurrentUser, NullCurrentUser>();
        services.AddScoped<ITenantProvider, TenantProvider>();
        services.AddScoped<IPasswordHasher, Argon2PasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();

        // Existing repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IServiceRepository, ServiceRepository>();
        services.AddScoped<IBarberRepository, BarberRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IPolicyRepository, PolicyRepository>();

        // New repositories
        services.AddScoped<IBarbershipLicenseRepository, BarbershipLicenseRepository>();
        services.AddScoped<IInvitationCodeRepository, InvitationCodeRepository>();
        services.AddScoped<ITestimonialRepository, TestimonialRepository>();
        services.AddScoped<IPlatformSettingsRepository, PlatformSettingsRepository>();
        services.AddScoped<IBarbershipSettingsRepository, BarbershipSettingsRepository>();
        services.AddScoped<IRatingRepository, RatingRepository>();
        services.AddScoped<IPostRepository, PostRepository>();

        services.AddScoped<AuditableEntityInterceptor>();

        services.AddDbContext<AppDbContext>((sp, options) =>
            options
                .UseNpgsql(connectionString)
                .AddInterceptors(sp.GetRequiredService<AuditableEntityInterceptor>()));

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>(name: "postgresql", tags: ["ready"]);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opts =>
            {
                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = "barberos-api",
                    ValidateAudience = true,
                    ValidAudience = "barberos-clients",
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ClockSkew = TimeSpan.FromSeconds(30),
                };

                // Browsers can't set an Authorization header on a WebSocket handshake, so SignalR's
                // client sends the token as ?access_token=... instead — only honor that on hub paths.
                opts.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            context.Token = accessToken;
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorization();

        return services;
    }
}
