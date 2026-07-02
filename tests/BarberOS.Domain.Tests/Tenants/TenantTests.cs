using BarberOS.Domain.Tenants;
using BarberOS.Domain.Tenants.Events;
using Xunit;

namespace BarberOS.Domain.Tests.Tenants;

public class TenantTests
{
    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithoutLicense_StatusIsPendingLicense()
    {
        var t = Tenant.Create("Barbería El Rey", "barberia-el-rey");
        Assert.Equal(TenantStatus.PendingLicense, t.Status);
        Assert.Null(t.LicenseCode);
    }

    [Fact]
    public void Create_WithLicense_StatusIsActive()
    {
        var t = Tenant.Create("Barbería El Rey", "slug",
            licenseCode: "LIC-001", licenseExpiresAt: DateTimeOffset.UtcNow.AddYears(1));
        Assert.Equal(TenantStatus.Active, t.Status);
    }

    [Fact]
    public void Create_RaisesTenantCreatedEvent()
    {
        var t = Tenant.Create("Mi Barbería", "mi-barberia");
        var ev = Assert.Single(t.DomainEvents);
        var tenantCreated = Assert.IsType<TenantCreatedEvent>(ev);
        Assert.Equal(t.Id, tenantCreated.TenantId);
        Assert.Equal("mi-barberia", tenantCreated.Slug);
    }

    [Fact]
    public void Create_ThrowsWhenNameIsEmpty()
    {
        Assert.Throws<ArgumentException>(() => Tenant.Create("", "slug"));
    }

    [Fact]
    public void Create_ThrowsWhenSlugIsEmpty()
    {
        Assert.Throws<ArgumentException>(() => Tenant.Create("Nombre", ""));
    }

    // ── ToSlug ────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Barbería El Rey", "barberia-el-rey")]
    [InlineData("Peluquería Ñoño", "peluqueria-nono")]
    [InlineData("UPPERCASE NAME", "uppercase-name")]
    [InlineData("  spaces  ", "spaces")]
    [InlineData("Café & Barber", "cafe-&-barber")]
    public void ToSlug_NormalizesText(string input, string expected)
    {
        Assert.Equal(expected, Tenant.ToSlug(input));
    }

    // ── IsLicenseActive ───────────────────────────────────────────────────────

    [Fact]
    public void IsLicenseActive_ReturnsTrue_WhenLicenseInFuture()
    {
        var t = Tenant.Create("T", "t");
        t.SetLicense("LIC-001", DateTimeOffset.UtcNow.AddDays(30));
        Assert.True(t.IsLicenseActive(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsLicenseActive_ReturnsFalse_WhenLicenseExpired()
    {
        var t = Tenant.Create("T", "t");
        t.SetLicense("LIC-001", DateTimeOffset.UtcNow.AddDays(-1));
        Assert.False(t.IsLicenseActive(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsLicenseActive_ReturnsFalse_WhenNoLicense()
    {
        var t = Tenant.Create("T", "t");
        Assert.False(t.IsLicenseActive(DateTimeOffset.UtcNow));
    }

    // ── SetLicense / RevokeLicense ────────────────────────────────────────────

    [Fact]
    public void SetLicense_ActivatesTenantAndStoresData()
    {
        var t = Tenant.Create("T", "t");
        var expires = DateTimeOffset.UtcNow.AddYears(1);
        t.SetLicense("LIC-42", expires);
        Assert.Equal("LIC-42", t.LicenseCode);
        Assert.Equal(expires, t.LicenseExpiresAt);
        Assert.Equal(TenantStatus.Active, t.Status);
    }

    [Fact]
    public void RevokeLicense_ClearsDataAndSetsPendingLicense()
    {
        var t = Tenant.Create("T", "t");
        t.SetLicense("LIC-42", DateTimeOffset.UtcNow.AddYears(1));
        t.RevokeLicense();
        Assert.Null(t.LicenseCode);
        Assert.Null(t.LicenseExpiresAt);
        Assert.Equal(TenantStatus.PendingLicense, t.Status);
    }
}
