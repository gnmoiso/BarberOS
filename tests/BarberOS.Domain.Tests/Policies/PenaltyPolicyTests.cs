using BarberOS.Domain.Policies;
using Xunit;

namespace BarberOS.Domain.Tests.Policies;

public class PenaltyPolicyTests
{
    private static readonly Guid TenantId = Guid.NewGuid();

    // ── CreateDefault ─────────────────────────────────────────────────────────

    [Fact]
    public void CreateDefault_IsDisabledWithSensibleValues()
    {
        var p = PenaltyPolicy.CreateDefault(TenantId);
        Assert.False(p.IsEnabled);
        Assert.Equal(24, p.CancellationWindowHours);
        Assert.Equal(0m, p.PenaltyPercentage);
    }

    // ── CalculatePenalty ──────────────────────────────────────────────────────

    [Fact]
    public void CalculatePenalty_ReturnsNull_WhenDisabled()
    {
        var p = PenaltyPolicy.CreateDefault(TenantId); // IsEnabled = false
        var apptStart = DateTimeOffset.UtcNow.AddHours(10);
        var cancelledAt = DateTimeOffset.UtcNow;

        var result = p.CalculatePenalty(50_000m, apptStart, cancelledAt);

        Assert.Null(result);
    }

    [Fact]
    public void CalculatePenalty_ReturnsNull_WhenCancelledOutsideWindow()
    {
        var p = PenaltyPolicy.CreateDefault(TenantId);
        p.Update(true, cancellationWindowHours: 24, penaltyPercentage: 50, maxPenaltyAmount: null);

        var apptStart = DateTimeOffset.UtcNow.AddHours(48);
        var cancelledAt = DateTimeOffset.UtcNow; // 48h before → outside 24h window

        Assert.Null(p.CalculatePenalty(50_000m, apptStart, cancelledAt));
    }

    [Fact]
    public void CalculatePenalty_AppliesPercentage_WhenInsideWindow()
    {
        var p = PenaltyPolicy.CreateDefault(TenantId);
        p.Update(true, cancellationWindowHours: 24, penaltyPercentage: 20, maxPenaltyAmount: null);

        var cancelledAt = DateTimeOffset.UtcNow;
        var apptStart = cancelledAt.AddHours(10); // 10h ahead → inside 24h window

        var penalty = p.CalculatePenalty(50_000m, apptStart, cancelledAt);

        Assert.Equal(10_000m, penalty); // 20% of 50,000
    }

    [Fact]
    public void CalculatePenalty_CapsAtMaxAmount()
    {
        var p = PenaltyPolicy.CreateDefault(TenantId);
        p.Update(true, cancellationWindowHours: 24, penaltyPercentage: 50, maxPenaltyAmount: 15_000m);

        var cancelledAt = DateTimeOffset.UtcNow;
        var apptStart = cancelledAt.AddHours(5);

        var penalty = p.CalculatePenalty(50_000m, apptStart, cancelledAt);

        // 50% of 50,000 = 25,000 → capped at 15,000
        Assert.Equal(15_000m, penalty);
    }

    [Fact]
    public void CalculatePenalty_DoesNotCapWhenBelowMax()
    {
        var p = PenaltyPolicy.CreateDefault(TenantId);
        p.Update(true, cancellationWindowHours: 24, penaltyPercentage: 10, maxPenaltyAmount: 10_000m);

        var cancelledAt = DateTimeOffset.UtcNow;
        var apptStart = cancelledAt.AddHours(5);

        var penalty = p.CalculatePenalty(50_000m, apptStart, cancelledAt);

        // 10% of 50,000 = 5,000 — below cap, no capping
        Assert.Equal(5_000m, penalty);
    }

    [Fact]
    public void CalculatePenalty_AtExactWindowBoundary_ReturnsNull()
    {
        var p = PenaltyPolicy.CreateDefault(TenantId);
        p.Update(true, cancellationWindowHours: 24, penaltyPercentage: 50, maxPenaltyAmount: null);

        var cancelledAt = DateTimeOffset.UtcNow;
        var apptStart = cancelledAt.AddHours(24); // exactly 24h → NOT inside window (>=)

        Assert.Null(p.CalculatePenalty(50_000m, apptStart, cancelledAt));
    }
}
