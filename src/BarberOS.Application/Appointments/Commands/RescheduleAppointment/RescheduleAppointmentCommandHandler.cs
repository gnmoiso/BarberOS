using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments.Commands.BookAppointment;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Appointments.Commands.RescheduleAppointment;

internal sealed class RescheduleAppointmentCommandHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IUnitOfWork uow) : ICommandHandler<RescheduleAppointmentCommand, AppointmentResponse>
{
    public async Task<AppointmentResponse> Handle(RescheduleAppointmentCommand cmd, CancellationToken ct)
    {
        var appointment = await appointments.FindByIdAsync(cmd.AppointmentId, ct)
            ?? throw new NotFoundException("APPOINTMENT_NOT_FOUND", $"Appointment {cmd.AppointmentId} not found.");

        var barber = await barbers.FindByIdAsync(cmd.BarberId, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {cmd.BarberId} not found.");

        var newEndsAt = cmd.NewStartsAt.AddMinutes(appointment.ServiceDurationMinutes);
        var hasConflict = await appointments.HasConflictAsync(
            appointment.TenantId, cmd.BarberId, cmd.NewStartsAt, newEndsAt, appointment.Id, ct);

        if (hasConflict)
            throw new ConflictException("SLOT_CONFLICT", "The selected time slot is not available.");

        appointment.Reschedule(cmd.BarberId, cmd.NewStartsAt);
        await uow.SaveChangesAsync(ct);

        var customer = await customers.FindByIdAsync(appointment.CustomerId, ct);
        return BookAppointmentCommandHandler.ToResponse(
            appointment, customer?.FullName ?? "Unknown", barber.DisplayName);
    }
}
