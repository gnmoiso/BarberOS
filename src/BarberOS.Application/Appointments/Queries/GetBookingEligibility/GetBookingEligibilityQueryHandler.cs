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
        var now = DateTimeOffset.UtcNow;

        // "Activa" = todavía no llegó la hora en que se habilita la calificación — no basta con
        // mirar Pending/Confirmed/InProgress a secas, porque un barbero ocupado puede dejar una
        // cita en ese estado para siempre y eso bloquearía al cliente de reservar indefinidamente.
        var active = history.FirstOrDefault(a =>
            a.Status is AppointmentStatus.Pending or AppointmentStatus.Confirmed or AppointmentStatus.InProgress
            && now < a.StartsAt.AddHours(1));
        if (active is not null)
            return new BookingEligibilityDto(false, BlockMessage, active.Id, null, minBookableDate);

        // Misma idea para la calificación pendiente: se habilita por tiempo transcurrido, no por
        // que el barbero haya marcado la cita como Completed.
        foreach (var rateable in history.Where(a => a.CanBeRated(now)))
        {
            var rated = await ratings.FindServiceRatingByAppointmentAsync(rateable.Id, ct) is not null;
            if (!rated)
                return new BookingEligibilityDto(false, BlockMessage, rateable.Id, rateable.StartsAt.AddHours(1), minBookableDate);
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
