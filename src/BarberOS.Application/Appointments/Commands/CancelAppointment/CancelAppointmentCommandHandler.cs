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
