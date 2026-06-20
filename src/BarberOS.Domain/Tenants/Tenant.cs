using BarberOS.Domain.Common;
using BarberOS.Domain.Tenants.Events;

namespace BarberOS.Domain.Tenants;

public sealed class Tenant : BaseGlobalAuditableEntity
{
    private Tenant() { }

    public string Name { get; private set; } = string.Empty;

    /// <summary>URL-safe slug: replaces spaces with hyphens. Used as /{slug} "domain".</summary>
    public string Slug { get; private set; } = string.Empty;

    public string? LegalName { get; private set; }
    public string? TaxId { get; private set; }
    public string Country { get; private set; } = "CO";
    public string Timezone { get; private set; } = "America/Bogota";
    public string Currency { get; private set; } = "COP";
    public TenantStatus Status { get; private set; }
    public string? OwnerName { get; private set; }
    public string? Address { get; private set; }
    public string? LicenseCode { get; private set; }
    public DateTimeOffset? LicenseExpiresAt { get; private set; }

    public bool IsLicenseActive(DateTimeOffset now) =>
        LicenseExpiresAt.HasValue && LicenseExpiresAt.Value > now;

    public static Tenant Create(string name, string slug, string? licenseCode = null, DateTimeOffset? licenseExpiresAt = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        var tenant = new Tenant
        {
            Name = name.Trim(),
            Slug = ToSlug(slug),
            Status = licenseCode is null ? TenantStatus.PendingLicense : TenantStatus.Active,
            LicenseCode = licenseCode,
            LicenseExpiresAt = licenseExpiresAt,
        };

        tenant.RaiseDomainEvent(new TenantCreatedEvent(tenant.Id, tenant.Slug));
        return tenant;
    }

    public void UpdateProfile(string name, string? ownerName, string? address)
    {
        Name = name.Trim();
        Slug = ToSlug(name);
        OwnerName = ownerName?.Trim();
        Address = address?.Trim();
    }

    public void SetLicense(string code, DateTimeOffset expiresAt)
    {
        LicenseCode = code;
        LicenseExpiresAt = expiresAt;
        Status = TenantStatus.Active;
    }

    public void Activate() => Status = TenantStatus.Active;
    public void Suspend() => Status = TenantStatus.Suspended;

    public static string ToSlug(string text) =>
        text.Trim().ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("á", "a").Replace("é", "e").Replace("í", "i")
            .Replace("ó", "o").Replace("ú", "u").Replace("ñ", "n");
}
