using BarberOS.Domain.Common;

namespace BarberOS.Domain.Policies;

public sealed class NoShowPolicy : BaseAuditableEntity
{
    private NoShowPolicy() { }

    public bool IsEnabled { get; private set; }
    public int MaxNoShows { get; private set; }
    public int BlockDurationDays { get; private set; }
    public decimal? NoShowFeeAmount { get; private set; }

    public static NoShowPolicy CreateDefault(Guid tenantId) =>
        new()
        {
            TenantId = tenantId,
            IsEnabled = false,
            MaxNoShows = 3,
            BlockDurationDays = 30,
        };

    public void Update(bool isEnabled, int maxNoShows, int blockDurationDays, decimal? noShowFeeAmount)
    {
        IsEnabled = isEnabled;
        MaxNoShows = maxNoShows;
        BlockDurationDays = blockDurationDays;
        NoShowFeeAmount = noShowFeeAmount;
    }
}
