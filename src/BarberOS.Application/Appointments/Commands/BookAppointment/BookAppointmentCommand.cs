using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Appointments.Commands.BookAppointment;

public sealed record BookAppointmentCommand(
    Guid CustomerId,
    Guid BarberId,
    Guid ServiceId,
    DateTimeOffset StartsAt,
    string? Notes) : ICommand<AppointmentResponse>;

public sealed record AppointmentResponse(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    Guid BarberId,
    string BarberName,
    Guid ServiceId,
    string ServiceName,
    decimal ServicePrice,
    int DurationMinutes,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string Status,
    string? Notes,
    decimal? PenaltyAmount);
