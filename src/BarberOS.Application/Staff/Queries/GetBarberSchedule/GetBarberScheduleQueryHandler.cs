using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Staff.Commands.SetSchedule;

namespace BarberOS.Application.Staff.Queries.GetBarberSchedule;

internal sealed class GetBarberScheduleQueryHandler(
    IBarberRepository barbers) : IQueryHandler<GetBarberScheduleQuery, List<ScheduleSlotDto>>
{
    public async Task<List<ScheduleSlotDto>> Handle(GetBarberScheduleQuery query, CancellationToken ct)
    {
        var schedule = await barbers.GetScheduleAsync(query.BarberId, ct);
        return schedule
            .Where(s => s.IsActive)
            .Select(s => new ScheduleSlotDto(s.Weekday, s.StartTime, s.EndTime, s.BreakStart, s.BreakEnd))
            .ToList();
    }
}
