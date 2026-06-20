using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Abstractions;
using BarberOS.Application.Appointments.Commands.BookAppointment;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Appointments.Commands.UpdateAppointmentStatus;

/// <summary>
/// Lets the barber walk an appointment through Pending → Confirmed → InProgress → Completed.
/// Marking it Completed is what eventually unlocks the customer's mandatory rating prompt and,
/// 50 minutes later, lets them book again (23.13.2) — without this, no appointment could ever
/// reach a state the rating-gate or "calificar" button could act on.
/// </summary>
internal sealed class UpdateAppointmentStatusCommandHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IUnitOfWork uow) : ICommandHandler<UpdateAppointmentStatusCommand, AppointmentResponse>
{
    public async Task<AppointmentResponse> Handle(UpdateAppointmentStatusCommand cmd, CancellationToken ct)
    {
        var appointment = await appointments.FindByIdAsync(cmd.AppointmentId, ct)
            ?? throw new NotFoundException("APPOINTMENT_NOT_FOUND", $"Appointment {cmd.AppointmentId} not found.");

        switch (cmd.Action)
        {
            case AppointmentStatusAction.Confirm: appointment.Confirm(); break;
            case AppointmentStatusAction.Start: appointment.Start(); break;
            case AppointmentStatusAction.Complete: appointment.Complete(); break;
        }

        await uow.SaveChangesAsync(ct);

        var customer = await customers.FindByIdAsync(appointment.CustomerId, ct);
        var barber = await barbers.FindByIdAsync(appointment.BarberId, ct);
        return BookAppointmentCommandHandler.ToResponse(appointment, customer?.FullName ?? "Unknown", barber?.DisplayName ?? "Unknown");
    }
}
