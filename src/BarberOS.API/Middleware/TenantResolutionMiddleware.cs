using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.API.Middleware;

/// <summary>
/// Resolves the current tenant from the JWT claim 'tenant_id' (authenticated panel requests).
/// Slug-based resolution for public booking arrives with the Reservas module.
///
/// Also enforces license status on every request for Barber-role users (not just at
/// login/switch-tenant) — if SuperAdmin deletes/revokes a license or deletes the tenant itself,
/// the barber loses panel access on their very next API call instead of staying in until their
/// JWT happens to expire.
/// </summary>
internal sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider, ITenantRepository tenants)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var claim = context.User.FindFirst("tenant_id");
            if (Guid.TryParse(claim?.Value, out var tenantId))
            {
                tenantProvider.SetTenant(tenantId);

                if (context.User.IsInRole("Barber") && !IsExempt(context.Request.Path))
                {
                    var tenant = await tenants.FindByIdAsync(tenantId, context.RequestAborted);
                    if (tenant is null || !tenant.IsLicenseActive(DateTimeOffset.UtcNow))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            title = "Tu barbería no tiene una licencia activa.",
                            status = 403,
                            errorCode = "license.required",
                        });
                        return;
                    }
                }
            }
        }

        await next(context);
    }

    // /auth/* must stay reachable so the barber can still log in, switch tenant, or activate a
    // new license code from /contact-barberos; platform-settings is the public contact info shown
    // on that same screen.
    private static bool IsExempt(PathString path) =>
        path.StartsWithSegments("/api/v1/auth") ||
        path.StartsWithSegments("/api/v1/super-admin/platform-settings") ||
        path.StartsWithSegments("/health");
}
