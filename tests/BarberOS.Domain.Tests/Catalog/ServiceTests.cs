using BarberOS.Domain.Catalog;
using Xunit;

namespace BarberOS.Domain.Tests.Catalog;

public class ServiceTests
{
    private static readonly Guid TenantId = Guid.NewGuid();

    [Fact]
    public void Create_SetsIsActiveTrue()
    {
        var s = Service.Create(TenantId, "Corte", 30, 25_000m);
        Assert.True(s.IsActive);
    }

    [Fact]
    public void Create_TrimsName()
    {
        var s = Service.Create(TenantId, "  Corte Clásico  ", 30, 25_000m);
        Assert.Equal("Corte Clásico", s.Name);
    }

    [Fact]
    public void Create_ThrowsWhenNameIsEmpty()
    {
        Assert.Throws<ArgumentException>(() => Service.Create(TenantId, "", 30, 25_000m));
    }

    [Fact]
    public void Create_ThrowsWhenDurationIsZero()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Service.Create(TenantId, "Corte", 0, 25_000m));
    }

    [Fact]
    public void Create_ThrowsWhenDurationIsNegative()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Service.Create(TenantId, "Corte", -5, 25_000m));
    }

    [Fact]
    public void Create_ThrowsWhenPriceIsNegative()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Service.Create(TenantId, "Corte", 30, -1m));
    }

    [Fact]
    public void Create_AllowsZeroPrice_ForFreeServices()
    {
        var s = Service.Create(TenantId, "Consulta gratuita", 15, 0m);
        Assert.Equal(0m, s.Price);
    }

    [Fact]
    public void SetActive_TogglesIsActive()
    {
        var s = Service.Create(TenantId, "Corte", 30, 25_000m);
        s.SetActive(false);
        Assert.False(s.IsActive);
        s.SetActive(true);
        Assert.True(s.IsActive);
    }

    [Fact]
    public void SetSortOrder_UpdatesOrder()
    {
        var s = Service.Create(TenantId, "Corte", 30, 25_000m);
        s.SetSortOrder(5);
        Assert.Equal(5, s.SortOrder);
    }

    [Fact]
    public void Update_ChangesAllMutableFields()
    {
        var s = Service.Create(TenantId, "Corte", 30, 25_000m);
        s.Update("Corte Premium", 45, 35_000m, "Con toalla caliente", "Premium");
        Assert.Equal("Corte Premium", s.Name);
        Assert.Equal(45, s.DurationMinutes);
        Assert.Equal(35_000m, s.Price);
        Assert.Equal("Con toalla caliente", s.Description);
        Assert.Equal("Premium", s.Category);
    }
}
