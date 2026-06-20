namespace BarberOS.Application.Appointments;

/// <summary>
/// Enforces the barbershop's configured advance-booking window (BarbershipSettings.DaysAheadNormalUser) —
/// a normal customer can't book/view slots before today + N days; a preferred customer bypasses it
/// entirely (23.15.1/23.15.2).
/// </summary>
public static class BookingWindowPolicy
{
    public static DateOnly MinBookableDate(DateOnly tenantLocalToday, int daysAheadNormalUser, bool isPreferred) =>
        isPreferred ? tenantLocalToday : tenantLocalToday.AddDays(daysAheadNormalUser);
}
