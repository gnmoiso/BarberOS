using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Ratings.Commands.RateAppointment;

/// <summary>
/// <paramref name="CallerUserId"/> is the rater's <c>User.Id</c> — the handler resolves the
/// matching legacy CRM Customer.Id itself (the same UserId/Customer.Id distinction that had to be
/// fixed for booking) rather than trusting a caller-supplied Customer.Id directly.
/// </summary>
public sealed record RateAppointmentCommand(
    Guid AppointmentId,
    Guid CallerUserId,
    int Stars,
    string? Comment) : ICommand;
