using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Ratings;

namespace BarberOS.Application.Ratings.Commands.RateAppointment;

internal sealed class RateAppointmentCommandHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IRatingRepository ratings,
    IDateTimeProvider clock,
    IUnitOfWork uow) : ICommandHandler<RateAppointmentCommand>
{
    public async Task<Unit> Handle(RateAppointmentCommand cmd, CancellationToken ct)
    {
        var appointment = await appointments.FindByIdAsync(cmd.AppointmentId, ct)
            ?? throw new NotFoundException("appointment.not_found", "Cita no encontrada.");

        var caller = await customers.FindByUserIdAsync(appointment.TenantId, cmd.CallerUserId, ct);
        if (caller is null || appointment.CustomerId != caller.Id)
            throw new ForbiddenException("rating.forbidden", "Solo puedes calificar tus propias citas.");

        // Time-based, not status-based — a busy barber who never marks the appointment
        // Confirmed/InProgress/Completed shouldn't block the customer from rating it.
        if (!appointment.CanBeRated(clock.UtcNow))
            throw new ValidationException("rating.not_yet_available", "Aún no puedes calificar esta cita.");

        var existing = await ratings.FindServiceRatingByAppointmentAsync(cmd.AppointmentId, ct);
        if (existing is not null)
            throw new ConflictException("rating.exists", "Ya calificaste esta cita.");

        var rating = ServiceRating.Create(
            cmd.AppointmentId, caller.Id, appointment.BarberId,
            cmd.Stars, cmd.Comment);

        rating.TenantId = appointment.TenantId;
        ratings.Add(rating);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
