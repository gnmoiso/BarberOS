using BarberOS.Domain.Common;

namespace BarberOS.Domain.Policies;

public sealed class PenaltyPolicy : BaseAuditableEntity
{
    private PenaltyPolicy() { }

    public bool IsEnabled { get; private set; }
    public int CancellationWindowHours { get; private set; }
    public decimal PenaltyPercentage { get; private set; }
    public decimal? MaxPenaltyAmount { get; private set; }

    public static PenaltyPolicy CreateDefault(Guid tenantId) =>
        new()
        {
            TenantId = tenantId,
            IsEnabled = false,
            CancellationWindowHours = 24,
            PenaltyPercentage = 0,
        };

    public void Update(bool isEnabled, int cancellationWindowHours, decimal penaltyPercentage, decimal? maxPenaltyAmount)
    {
        IsEnabled = isEnabled;
        CancellationWindowHours = cancellationWindowHours;
        PenaltyPercentage = penaltyPercentage;
        MaxPenaltyAmount = maxPenaltyAmount;
    }

    public decimal? CalculatePenalty(decimal servicePrice, DateTimeOffset appointmentStart, DateTimeOffset cancelledAt)
    {
        if (!IsEnabled) return null;
        var hoursBeforeAppointment = (appointmentStart - cancelledAt).TotalHours;
        if (hoursBeforeAppointment >= CancellationWindowHours) return null;

        var penalty = servicePrice * PenaltyPercentage / 100;
        if (MaxPenaltyAmount.HasValue && penalty > MaxPenaltyAmount.Value)
            penalty = MaxPenaltyAmount.Value;

        return penalty;
    }
}
