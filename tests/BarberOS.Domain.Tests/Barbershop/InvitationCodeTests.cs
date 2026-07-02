using BarberOS.Domain.Barbershop;
using Xunit;

namespace BarberOS.Domain.Tests.Barbershop;

public class InvitationCodeTests
{
    private static readonly Guid TenantId = Guid.NewGuid();

    [Fact]
    public void Create_IsActiveByDefault()
    {
        var code = InvitationCode.Create(TenantId, "abc1234567");
        Assert.True(code.IsActive);
        Assert.Equal(0, code.UsageCount);
    }

    [Fact]
    public void Create_UppercasesCode()
    {
        var code = InvitationCode.Create(TenantId, "abc1234567");
        Assert.Equal("ABC1234567", code.Code);
    }

    [Fact]
    public void Create_StoresLabel()
    {
        var code = InvitationCode.Create(TenantId, "XYZ", "Campaña verano");
        Assert.Equal("Campaña verano", code.Label);
    }

    [Fact]
    public void RecordUsage_IncrementsUsageCount()
    {
        var code = InvitationCode.Create(TenantId, "XYZ");
        code.RecordUsage();
        code.RecordUsage();
        Assert.Equal(2, code.UsageCount);
    }

    [Fact]
    public void Deactivate_SetsIsActiveFalse()
    {
        var code = InvitationCode.Create(TenantId, "XYZ");
        code.Deactivate();
        Assert.False(code.IsActive);
    }

    [Fact]
    public void Activate_ReactivatesDeactivatedCode()
    {
        var code = InvitationCode.Create(TenantId, "XYZ");
        code.Deactivate();
        code.Activate();
        Assert.True(code.IsActive);
    }
}
