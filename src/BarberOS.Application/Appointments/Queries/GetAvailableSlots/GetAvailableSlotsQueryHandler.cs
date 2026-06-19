using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Appointments.Queries.GetAvailableSlots;

internal sealed class GetAvailableSlotsQueryHandler(
    IBarberRepository barbers,
    IServiceRepository services,
    IAppointmentRepository appointments,
    ITenantProvider tenantProvider) : IQueryHandler<GetAvailableSlotsQuery, IReadOnlyList<SlotDto>>
{
    public async Task<IReadOnlyList<SlotDto>> Handle(GetAvailableSlotsQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;

        var barber = await barbers.FindByIdAsync(query.BarberId, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {query.BarberId} not found.");

        var service = await services.FindByIdAsync(query.ServiceId, ct)
            ?? throw new NotFoundException("SERVICE_NOT_FOUND", $"Service {query.ServiceId} not found.");

        var schedules = await barbers.GetScheduleAsync(query.BarberId, ct);
        var weekdaySchedule = schedules.FirstOrDefault(s => s.Weekday == query.Date.DayOfWeek && s.IsActive);

        if (weekdaySchedule is null) return [];

        var dayStart = new DateTimeOffset(query.Date.ToDateTime(weekdaySchedule.StartTime), TimeSpan.Zero);
        var dayEnd = new DateTimeOffset(query.Date.ToDateTime(weekdaySchedule.EndTime), TimeSpan.Zero);

        var booked = await appointments.ListByDateRangeAsync(tenantId, dayStart, dayEnd, query.BarberId, ct);
        var busySlots = booked
            .Where(a => a.Status is not (Domain.Appointments.AppointmentStatus.CancelledByCustomer
                or Domain.Appointments.AppointmentStatus.CancelledByBarber))
            .Select(a => (a.StartsAt, a.EndsAt))
            .ToList();

        var slots = new List<SlotDto>();
        var slotStart = dayStart;
        var duration = TimeSpan.FromMinutes(service.DurationMinutes);

        while (slotStart + duration <= dayEnd)
        {
            var slotEnd = slotStart + duration;
            var overlaps = busySlots.Any(b => slotStart < b.EndsAt && slotEnd > b.StartsAt);
            if (!overlaps) slots.Add(new SlotDto(slotStart, slotEnd));
            slotStart = slotStart.AddMinutes(30);
        }

        return slots;
    }
}
