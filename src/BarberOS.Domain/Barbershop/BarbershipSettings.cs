using BarberOS.Domain.Common;

namespace BarberOS.Domain.Barbershop;

/// <summary>
/// Per-barbershop configuration. Controls booking rules, pricing, and UX.
/// </summary>
public sealed class BarbershipSettings : BaseAuditableEntity
{
    private BarbershipSettings() { }

    /// <summary>Days in advance a normal (non-preferred) customer can book.</summary>
    public int DaysAheadNormalUser { get; private set; } = 3;

    /// <summary>Base price when no service is selected.</summary>
    public decimal BasePriceNoService { get; private set; }

    public string Currency { get; private set; } = "USD";

    // Optional add-ons defined by the barbershop
    public decimal BeardPrice { get; private set; }
    public decimal EyebrowPrice { get; private set; }
    public decimal WashPrice { get; private set; }

    // Barbershop profile
    public string? Address { get; private set; }
    public string? OwnerName { get; private set; }
    public string? LogoUrl { get; private set; }

    /// <summary>Minutes before an appointment the barber wants their reminder notification to fire. Customers always get 20.</summary>
    public int ReminderMinutesBeforeAppointment { get; private set; } = 20;

    /// <summary>23.19 — minimum lead time, in minutes, between "now" and the earliest bookable slot
    /// on the SAME day (e.g. 30 means no slot may start in the next 30 minutes). One of 15/30/45/60.</summary>
    public int MinLeadMinutes { get; private set; } = 30;

    public static BarbershipSettings CreateDefault(Guid tenantId) =>
        new() { TenantId = tenantId };

    public void UpdateGeneral(int daysAhead, decimal basePrice, string currency,
        decimal? beardPrice, decimal? eyebrowPrice, decimal? washPrice, int? reminderMinutesBefore = null,
        int? minLeadMinutes = null)
    {
        DaysAheadNormalUser = daysAhead;
        BasePriceNoService = basePrice;
        Currency = currency;
        BeardPrice = beardPrice ?? 0;
        EyebrowPrice = eyebrowPrice ?? 0;
        WashPrice = washPrice ?? 0;
        if (reminderMinutesBefore.HasValue)
            ReminderMinutesBeforeAppointment = Math.Clamp(reminderMinutesBefore.Value, 1, 1440);
        if (minLeadMinutes.HasValue)
            MinLeadMinutes = minLeadMinutes.Value is 15 or 30 or 45 or 60 ? minLeadMinutes.Value : MinLeadMinutes;
    }

    public void UpdateProfile(string? address, string? ownerName)
    {
        Address = address;
        OwnerName = ownerName;
    }

    public void SetLogo(string? logoUrl) => LogoUrl = logoUrl;
}
