using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Staff.Commands.SetSchedule;

namespace BarberOS.Application.Staff.Queries.GetBarberSchedule;

public sealed record GetBarberScheduleQuery(Guid BarberId) : IQuery<List<ScheduleSlotDto>>;
