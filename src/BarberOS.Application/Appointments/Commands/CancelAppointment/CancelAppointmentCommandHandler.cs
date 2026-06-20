using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments.Commands.BookAppointment;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Appointments.Commands.CancelAppointment;

internal sealed class CancelAppointmentCommandHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IPolicyRepository policies,
    IUnitOfWork uow) : ICommandHandler<CancelAppointmentCommand, AppointmentResponse>
{
    public async Task<AppointmentResponse> Handle(CancelAppointmentCommand cmd, CancellationToken ct)
    {
        var appointment = await appointments.FindByIdAsync(cmd.AppointmentId, ct)
            ?? throw new NotFoundException("APPOINTMENT_NOT_FOUND", $"Appointment {cmd.AppointmentId} not found.");

        if (appointment.TenantId != cmd.CallerTenantId)
            throw new NotFoundException("APPOINTMENT_NOT_FOUND", $"Appointment {cmd.AppointmentId} not found.");

        // 23.14.2 — only the barbershop's own staff may cancel "as the barbershop" (no penalty,
        // no questions asked); a customer may only cancel their own appointment, never someone else's.
        if (cmd.CancelledByBarber)
        {
            if (!cmd.CallerIsBarber)
                throw new ForbiddenException("CANCEL_FORBIDDEN", "Solo el dueño de la barbería o un barbero autorizado puede eliminar esta cita.");
        }
        else
        {
            var caller = await customers.FindByUserIdAsync(cmd.CallerTenantId, cmd.CallerUserId, ct);
            if (caller is null || appointment.CustomerId != caller.Id)
                throw new ForbiddenException("CANCEL_FORBIDDEN", "Solo puedes cancelar tus propias citas.");
        }

        decimal? penalty = null;
        string? penaltyReason = null;

        if (!cmd.CancelledByBarber)
        {
            var penaltyPolicy = await policies.GetPenaltyPolicyAsync(appointment.TenantId, ct);
            if (penaltyPolicy is not null)
            {
                penalty = penaltyPolicy.CalculatePenalty(appointment.ServicePrice, appointment.StartsAt, DateTimeOffset.UtcNow);
                if (penalty.HasValue)
                    penaltyReason = $"Cancellation within {penaltyPolicy.CancellationWindowHours}h window — informational only, not charged by BarberOS.";
            }

            appointment.CancelByCustomer(cmd.Reason, penalty, penaltyReason);
        }
        else
        {
            appointment.CancelByBarber(cmd.Reason);
        }

        await uow.SaveChangesAsync(ct);

        var customer = await customers.FindByIdAsync(appointment.CustomerId, ct);
        var barber = await barbers.FindByIdAsync(appointment.BarberId, ct);

        return BookAppointmentCommandHandler.ToResponse(
            appointment,
            customer?.FullName ?? "Unknown",
            barber?.DisplayName ?? "Unknown");
    }
}
