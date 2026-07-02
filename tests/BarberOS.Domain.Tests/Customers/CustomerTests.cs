using BarberOS.Domain.Customers;
using Xunit;

namespace BarberOS.Domain.Tests.Customers;

public class CustomerTests
{
    private static readonly Guid TenantId = Guid.NewGuid();

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_NormalizesEmailToLowerCase()
    {
        var c = Customer.Create(TenantId, "Juan Pérez", "3001234567", "JUAN@EXAMPLE.COM");
        Assert.Equal("juan@example.com", c.Email);
    }

    [Fact]
    public void Create_TrimsWhitespace()
    {
        var c = Customer.Create(TenantId, "  Juan  ", "  3001234567  ");
        Assert.Equal("Juan", c.FullName);
        Assert.Equal("3001234567", c.Phone);
    }

    [Fact]
    public void Create_ThrowsWhenNameIsEmpty()
    {
        Assert.Throws<ArgumentException>(() => Customer.Create(TenantId, "", "3001234567"));
    }

    [Fact]
    public void Create_ThrowsWhenPhoneIsEmpty()
    {
        Assert.Throws<ArgumentException>(() => Customer.Create(TenantId, "Juan", ""));
    }

    // ── IsBlocked ─────────────────────────────────────────────────────────────

    [Fact]
    public void IsBlocked_ReturnsFalse_WhenNotBlocked()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        Assert.False(c.IsBlocked(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsBlocked_ReturnsTrue_WhenBlockedUntilFuture()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        c.Block(DateTimeOffset.UtcNow.AddDays(30), "Tres no-shows");
        Assert.True(c.IsBlocked(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsBlocked_ReturnsFalse_AfterBlockExpires()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        c.Block(DateTimeOffset.UtcNow.AddDays(-1), "Bloqueo vencido");
        Assert.False(c.IsBlocked(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Block_WithNullUntil_BlocksPermanently()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        c.Block(null, "Permanente");
        // DateTimeOffset.MaxValue > any realistic "now"
        Assert.True(c.IsBlocked(DateTimeOffset.UtcNow));
        Assert.True(c.IsBlocked(DateTimeOffset.UtcNow.AddYears(100)));
    }

    [Fact]
    public void Unblock_ClearsBlockAndReason()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        c.Block(DateTimeOffset.UtcNow.AddDays(30), "Motivo");
        c.Unblock();
        Assert.False(c.IsBlocked(DateTimeOffset.UtcNow));
        Assert.Null(c.BookingBlockReason);
    }

    // ── RecordVisit ───────────────────────────────────────────────────────────

    [Fact]
    public void RecordVisit_SetsFirstVisitOnFirstCall()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        var now = DateTimeOffset.UtcNow;
        c.RecordVisit(now);
        Assert.Equal(now, c.FirstVisitAt);
        Assert.Equal(now, c.LastVisitAt);
    }

    [Fact]
    public void RecordVisit_DoesNotOverwriteFirstVisit()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        var first = DateTimeOffset.UtcNow.AddDays(-10);
        var second = DateTimeOffset.UtcNow;
        c.RecordVisit(first);
        c.RecordVisit(second);
        Assert.Equal(first, c.FirstVisitAt);
        Assert.Equal(second, c.LastVisitAt);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_ChangesAllMutableFields()
    {
        var c = Customer.Create(TenantId, "Juan", "3001234567");
        c.Update("Pedro", "3109876543", null, "pedro@example.com", "cliente VIP");
        Assert.Equal("Pedro", c.FullName);
        Assert.Equal("3109876543", c.Phone);
        Assert.Equal("pedro@example.com", c.Email);
        Assert.Equal("cliente VIP", c.Notes);
    }
}
