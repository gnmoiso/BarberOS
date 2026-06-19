using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Staff.Commands.SetSchedule;

public sealed record ScheduleSlotDto(DayOfWeek Weekday, TimeOnly StartTime, TimeOnly EndTime);

public sealed record SetScheduleCommand(Guid BarberId, IReadOnlyList<ScheduleSlotDto> Slots) : ICommand;
