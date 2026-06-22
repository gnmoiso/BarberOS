using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Appointments.Queries.GetAvailableSlots;

internal sealed class GetAvailableSlotsQueryHandler(
    IBarberRepository barbers,
    IServiceRepository services,
    IAppointmentRepository appointments,
    ITenantRepository tenants,
    IBarbershipSettingsRepository settings,
    IUserRepository users,
    ITenantProvider tenantProvider) : IQueryHandler<GetAvailableSlotsQuery, IReadOnlyList<SlotDto>>
{
    public async Task<IReadOnlyList<SlotDto>> Handle(GetAvailableSlotsQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;

        var barber = await barbers.FindByIdAsync(query.BarberId, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {query.BarberId} not found.");

        var service = await services.FindByIdAsync(query.ServiceId, ct)
            ?? throw new NotFoundException("SERVICE_NOT_FOUND", $"Service {query.ServiceId} not found.");

        var tenant = await tenants.FindByIdAsync(tenantId, ct);
        var timeZone = ResolveTimeZone(tenant?.Timezone);

        // 23.15.1/23.15.2 — a normal customer can't even see slots before the barbershop's
        // configured advance-booking window; a preferred customer bypasses it entirely.
        var tenantSettings = await settings.GetByTenantAsync(tenantId, ct);
        var daysAhead = tenantSettings?.DaysAheadNormalUser ?? 0;
        var isPreferred = await users.IsPreferredCustomerAsync(tenantId, query.CallerUserId, ct);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, timeZone).DateTime);
        var minDate = BookingWindowPolicy.MinBookableDate(today, daysAhead, isPreferred);
        if (query.Date < minDate) return [];

        var schedules = await barbers.GetScheduleAsync(query.BarberId, ct);
        var weekdaySchedule = schedules.FirstOrDefault(s => s.Weekday == query.Date.DayOfWeek && s.IsActive);

        if (weekdaySchedule is null) return [];

        // WorkSchedule times are wall-clock hours in the barbershop's own timezone (e.g. 08:00 in
        // America/Bogota), not UTC — they must be converted before comparing against StartsAt/EndsAt,
        // which are always stored in UTC. Tagging them as UTC directly shifted every slot by the
        // tenant's offset (23.12.9).
        DateTimeOffset ToUtc(TimeOnly time) =>
            new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(query.Date.ToDateTime(time), timeZone), TimeSpan.Zero);

        var dayStart = ToUtc(weekdaySchedule.StartTime);
        var dayEnd = ToUtc(weekdaySchedule.EndTime);

        var booked = await appointments.ListByDateRangeAsync(tenantId, dayStart, dayEnd, query.BarberId, ct);
        var busySlots = booked
            .Where(a => a.Status is not (Domain.Appointments.AppointmentStatus.CancelledByCustomer
                or Domain.Appointments.AppointmentStatus.CancelledByBarber))
            .Select(a => (a.StartsAt, a.EndsAt))
            .ToList();

        DateTimeOffset? breakStart = weekdaySchedule.BreakStart.HasValue ? ToUtc(weekdaySchedule.BreakStart.Value) : null;
        DateTimeOffset? breakEnd = weekdaySchedule.BreakEnd.HasValue ? ToUtc(weekdaySchedule.BreakEnd.Value) : null;

        // 23.19 — never offer a slot that's already started or that doesn't leave the barbershop's
        // configured minimum lead time (e.g. 30 min) to prepare. A no-op for future dates, since
        // dayStart is already far beyond "now" then.
        var earliestStart = DateTimeOffset.UtcNow.AddMinutes(tenantSettings?.MinLeadMinutes ?? 30);

        var slots = new List<SlotDto>();
        var slotStart = dayStart;
        var duration = TimeSpan.FromMinutes(service.DurationMinutes);

        while (slotStart + duration <= dayEnd)
        {
            var slotEnd = slotStart + duration;
            var overlapsAppointment = busySlots.Any(b => slotStart < b.EndsAt && slotEnd > b.StartsAt);
            var overlapsBreak = breakStart.HasValue && breakEnd.HasValue && slotStart < breakEnd.Value && slotEnd > breakStart.Value;
            var tooSoon = slotStart < earliestStart;
            if (!overlapsAppointment && !overlapsBreak && !tooSoon) slots.Add(new SlotDto(slotStart, slotEnd));
            slotStart = slotStart.AddMinutes(30);
        }

        return slots;
    }

    private static TimeZoneInfo ResolveTimeZone(string? ianaId)
    {
        if (string.IsNullOrWhiteSpace(ianaId)) return TimeZoneInfo.Utc;
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(ianaId);
        }
        catch (TimeZoneNotFoundException)
        {
            // Fixed UTC-5 fallback covers the platform's only supported market (Colombia) if the
            // host's tz database is somehow missing the IANA id — never crash slot generation over this.
            return TimeZoneInfo.CreateCustomTimeZone("Fallback-CO", TimeSpan.FromHours(-5), "Colombia (fallback)", "Colombia (fallback)");
        }
    }
}
