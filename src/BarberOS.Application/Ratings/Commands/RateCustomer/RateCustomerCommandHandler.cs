using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Ratings;

namespace BarberOS.Application.Ratings.Commands.RateCustomer;

internal sealed class RateCustomerCommandHandler(
    IAppointmentRepository appointments,
    IBarberRepository barbers,
    IRatingRepository ratings,
    IUnitOfWork uow) : ICommandHandler<RateCustomerCommand>
{
    public async Task<Unit> Handle(RateCustomerCommand cmd, CancellationToken ct)
    {
        var appointment = await appointments.FindByIdAsync(cmd.AppointmentId, ct)
            ?? throw new NotFoundException("appointment.not_found", "Cita no encontrada.");

        var caller = await barbers.FindByUserIdAsync(appointment.TenantId, cmd.CallerUserId, ct);
        if (caller is null || appointment.BarberId != caller.Id)
            throw new ForbiddenException("rating.forbidden", "No puedes calificar clientes de otra barbería.");

        var existing = await ratings.FindCustomerRatingByAppointmentAsync(cmd.AppointmentId, ct);
        if (existing is not null)
            throw new ConflictException("rating.exists", "Ya calificaste al cliente de esta cita.");

        var rating = CustomerRating.Create(cmd.AppointmentId, appointment.CustomerId, caller.Id, cmd.Stars, cmd.Notes);
        rating.TenantId = appointment.TenantId;
        ratings.AddCustomerRating(rating);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
