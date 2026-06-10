using BarberOS.Application.Abstractions;

namespace BarberOS.Infrastructure.Identity;

internal sealed class TenantProvider : ITenantProvider
{
    public Guid? TenantId { get; private set; }

    public void SetTenant(Guid tenantId) => TenantId = tenantId;
}
