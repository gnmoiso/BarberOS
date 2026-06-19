using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Appointments.Queries.GetAvailableSlots;

public sealed record GetAvailableSlotsQuery(Guid BarberId, Guid ServiceId, DateOnly Date)
    : IQuery<IReadOnlyList<SlotDto>>;

public sealed record SlotDto(DateTimeOffset StartsAt, DateTimeOffset EndsAt);
