using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments;
using BarberOS.Domain.Appointments;

namespace BarberOS.Application.Appointments.Queries.GetBookingEligibility;

internal sealed class GetBookingEligibilityQueryHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IRatingRepository ratings,
    IBarbershipSettingsRepository settings,
    IUserRepository users,
    ITenantRepository tenants,
    ITenantProvider tenantProvider) : IQueryHandler<GetBookingEligibilityQuery, BookingEligibilityDto>
{
    private const string BlockMessage = "Tienes una cita activa o una calificación pendiente. Debes finalizarla antes de reservar una nueva cita.";

    public async Task<BookingEligibilityDto> Handle(GetBookingEligibilityQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var minBookableDate = await ComputeMinBookableDateAsync(tenantId, query.CallerUserId, ct);

        // 23.16.4/23.16.5 — global to the user, across every barbershop they belong to, not just
        // the currently active tenant.
        var customerIds = (await customers.ListByUserIdAcrossTenantsAsync(query.CallerUserId, ct)).Select(c => c.Id).ToList();
        if (customerIds.Count == 0) return new BookingEligibilityDto(true, null, null, null, minBookableDate);

        var history = await appointments.ListByCustomerIdsAsync(customerIds, page: 1, size: 200, ct);

        var active = history.FirstOrDefault(a => a.Status is AppointmentStatus.Pending or AppointmentStatus.Confirmed);
        if (active is not null)
            return new BookingEligibilityDto(false, BlockMessage, active.Id, null, minBookableDate);

        foreach (var completed in history.Where(a => a.Status == AppointmentStatus.Completed))
        {
            var rated = await ratings.FindServiceRatingByAppointmentAsync(completed.Id, ct) is not null;
            if (!rated)
                return new BookingEligibilityDto(false, BlockMessage, completed.Id, completed.StartsAt.AddMinutes(50), minBookableDate);
        }

        return new BookingEligibilityDto(true, null, null, null, minBookableDate);
    }

    private async Task<DateOnly> ComputeMinBookableDateAsync(Guid tenantId, Guid callerUserId, CancellationToken ct)
    {
        var tenant = await tenants.FindByIdAsync(tenantId, ct);
        var timeZone = ResolveTimeZone(tenant?.Timezone);
        var tenantSettings = await settings.GetByTenantAsync(tenantId, ct);
        var daysAhead = tenantSettings?.DaysAheadNormalUser ?? 0;
        var isPreferred = await users.IsPreferredCustomerAsync(tenantId, callerUserId, ct);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, timeZone).DateTime);
        return BookingWindowPolicy.MinBookableDate(today, daysAhead, isPreferred);
    }

    private static TimeZoneInfo ResolveTimeZone(string? ianaId)
    {
        if (string.IsNullOrWhiteSpace(ianaId)) return TimeZoneInfo.Utc;
        try { return TimeZoneInfo.FindSystemTimeZoneById(ianaId); }
        catch (TimeZoneNotFoundException) { return TimeZoneInfo.CreateCustomTimeZone("Fallback-CO", TimeSpan.FromHours(-5), "Colombia (fallback)", "Colombia (fallback)"); }
    }
}
