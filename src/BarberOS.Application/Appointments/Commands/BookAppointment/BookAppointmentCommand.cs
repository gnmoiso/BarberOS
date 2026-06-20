using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Appointments.Commands.BookAppointment;

/// <summary>
/// <paramref name="CustomerUserId"/> is the target customer's <c>User.Id</c> — the same id returned by
/// GET /clients (real tenant members who joined via invitation code), not the legacy CRM Customer.Id.
/// When a customer books for themselves it's null and resolved from <paramref name="CallerUserId"/> instead.
/// </summary>
public sealed record BookAppointmentCommand(
    Guid? CustomerUserId,
    Guid CallerUserId,
    Guid BarberId,
    Guid ServiceId,
    DateTimeOffset StartsAt,
    string? Notes,
    IReadOnlyList<AppointmentAddOnRequest>? AddOns = null) : ICommand<AppointmentResponse>;

public sealed record AppointmentAddOnRequest(string Name, decimal Price);

public sealed record AppointmentAddOnResponse(string Name, decimal Price);

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
    decimal? PenaltyAmount,
    bool IsRated = false,
    IReadOnlyList<AppointmentAddOnResponse>? AddOns = null,
    decimal TotalPrice = 0,
    Guid TenantId = default,
    string? TenantName = null);
