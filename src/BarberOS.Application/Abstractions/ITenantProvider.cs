namespace BarberOS.Application.Abstractions;

/// <summary>
/// Scoped service that carries the resolved TenantId for the current request.
/// Set by TenantResolutionMiddleware from JWT claim; read by AppDbContext global filters.
/// </summary>
public interface ITenantProvider
{
    Guid? TenantId { get; }

    /// <summary>Called only by TenantResolutionMiddleware — not for application code.</summary>
    void SetTenant(Guid tenantId);
}
