using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Appointments.Queries.GetBookingEligibility;

public sealed record GetBookingEligibilityQuery(Guid CallerUserId) : IQuery<BookingEligibilityDto>;

/// <summary>
/// <paramref name="RatingAvailableAt"/> is when the "calificar" button should enable for the
/// blocking appointment (23.13.2) — 50 minutes after its scheduled start, regardless of how long
/// ago that already was.
/// </summary>
public sealed record BookingEligibilityDto(
    bool CanBook,
    string? Reason,
    Guid? BlockingAppointmentId,
    DateTimeOffset? RatingAvailableAt,
    DateOnly MinBookableDate);
