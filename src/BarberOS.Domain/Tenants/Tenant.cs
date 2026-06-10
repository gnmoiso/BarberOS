using BarberOS.Domain.Common;
using BarberOS.Domain.Tenants.Events;

namespace BarberOS.Domain.Tenants;

public sealed class Tenant : BaseGlobalAuditableEntity
{
    private Tenant() { }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? LegalName { get; private set; }
    public string? TaxId { get; private set; }
    public string Country { get; private set; } = "CO";
    public string Timezone { get; private set; } = "America/Bogota";
    public string Currency { get; private set; } = "COP";
    public TenantStatus Status { get; private set; }

    public static Tenant Create(string name, string slug)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        var tenant = new Tenant
        {
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Status = TenantStatus.Trial,
        };

        tenant.RaiseDomainEvent(new TenantCreatedEvent(tenant.Id, tenant.Slug));
        return tenant;
    }

    public void Activate() => Status = TenantStatus.Active;

    public void Suspend() => Status = TenantStatus.Suspended;
}
