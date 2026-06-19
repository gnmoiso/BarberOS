using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments.Commands.BookAppointment;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Appointments.Commands.MarkNoShow;

internal sealed class MarkNoShowCommandHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IPolicyRepository policies,
    IUnitOfWork uow) : ICommandHandler<MarkNoShowCommand, AppointmentResponse>
{
    public async Task<AppointmentResponse> Handle(MarkNoShowCommand cmd, CancellationToken ct)
    {
        var appointment = await appointments.FindByIdAsync(cmd.AppointmentId, ct)
            ?? throw new NotFoundException("APPOINTMENT_NOT_FOUND", $"Appointment {cmd.AppointmentId} not found.");

        var noShowPolicy = await policies.GetNoShowPolicyAsync(appointment.TenantId, ct);

        decimal? fee = null;
        string? feeReason = null;

        if (noShowPolicy?.IsEnabled == true && noShowPolicy.NoShowFeeAmount.HasValue)
        {
            fee = noShowPolicy.NoShowFeeAmount;
            feeReason = "No-show fee — informational only, not charged by BarberOS.";
        }

        appointment.MarkNoShow(fee, feeReason);

        if (noShowPolicy?.IsEnabled == true)
        {
            var noShowCount = await appointments.CountNoShowsAsync(appointment.TenantId, appointment.CustomerId, ct) + 1;
            if (noShowCount >= noShowPolicy.MaxNoShows)
            {
                var customer = await customers.FindByIdAsync(appointment.CustomerId, ct);
                customer?.Block(DateTimeOffset.UtcNow.AddDays(noShowPolicy.BlockDurationDays),
                    $"Blocked after {noShowPolicy.MaxNoShows} no-shows.");
            }
        }

        await uow.SaveChangesAsync(ct);

        var cust = await customers.FindByIdAsync(appointment.CustomerId, ct);
        var barber = await barbers.FindByIdAsync(appointment.BarberId, ct);

        return BookAppointmentCommandHandler.ToResponse(
            appointment, cust?.FullName ?? "Unknown", barber?.DisplayName ?? "Unknown");
    }
}
