using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Ratings.Commands.RateCustomer;

/// <summary>
/// <paramref name="CallerUserId"/> is the rating barber's <c>User.Id</c> — the handler resolves
/// the matching staff <c>Barber.Id</c> itself (they're different entities/ids) rather than
/// trusting a caller-supplied Barber.Id directly.
/// </summary>
public sealed record RateCustomerCommand(
    Guid AppointmentId,
    Guid CallerUserId,
    int Stars,
    string? Notes) : ICommand;
