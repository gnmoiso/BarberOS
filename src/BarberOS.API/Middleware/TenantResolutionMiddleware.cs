using BarberOS.Application.Abstractions;

namespace BarberOS.API.Middleware;

/// <summary>
/// Resolves the current tenant from the JWT claim 'tenant_id' (authenticated panel requests).
/// Slug-based resolution for public booking arrives with the Reservas module.
/// </summary>
internal sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var claim = context.User.FindFirst("tenant_id");
            if (Guid.TryParse(claim?.Value, out var tenantId))
                tenantProvider.SetTenant(tenantId);
        }

        await next(context);
    }
}
