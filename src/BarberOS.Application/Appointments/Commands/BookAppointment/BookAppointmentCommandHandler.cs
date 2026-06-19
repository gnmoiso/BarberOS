using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Appointments;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Appointments.Commands.BookAppointment;

internal sealed class BookAppointmentCommandHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IServiceRepository services,
    ITenantProvider tenantProvider,
    IUnitOfWork uow) : ICommandHandler<BookAppointmentCommand, AppointmentResponse>
{
    public async Task<AppointmentResponse> Handle(BookAppointmentCommand cmd, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;

        var customer = await customers.FindByIdAsync(cmd.CustomerId, ct)
            ?? throw new NotFoundException("CUSTOMER_NOT_FOUND", $"Customer {cmd.CustomerId} not found.");

        if (customer.IsBlocked(DateTimeOffset.UtcNow))
            throw new ForbiddenException("CUSTOMER_BLOCKED", "This customer is blocked from booking.");

        var barber = await barbers.FindByIdAsync(cmd.BarberId, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {cmd.BarberId} not found.");

        var service = await services.FindByIdAsync(cmd.ServiceId, ct)
            ?? throw new NotFoundException("SERVICE_NOT_FOUND", $"Service {cmd.ServiceId} not found.");

        if (!service.IsActive)
            throw new ConflictException("SERVICE_INACTIVE", "The selected service is not active.");

        var endsAt = cmd.StartsAt.AddMinutes(service.DurationMinutes);

        var hasConflict = await appointments.HasConflictAsync(tenantId, cmd.BarberId, cmd.StartsAt, endsAt, null, ct);
        if (hasConflict)
            throw new ConflictException("SLOT_CONFLICT", "The selected time slot is not available.");

        var appointment = Appointment.Book(
            tenantId, cmd.CustomerId, cmd.BarberId, cmd.ServiceId,
            service.Name, service.Price, service.DurationMinutes,
            cmd.StartsAt, cmd.Notes);

        appointments.Add(appointment);
        await uow.SaveChangesAsync(ct);

        return ToResponse(appointment, customer.FullName, barber.DisplayName);
    }

    internal static AppointmentResponse ToResponse(Appointment a, string customerName, string barberName) =>
        new(a.Id, a.CustomerId, customerName, a.BarberId, barberName, a.ServiceId,
            a.ServiceName, a.ServicePrice, a.ServiceDurationMinutes,
            a.StartsAt, a.EndsAt, a.Status.ToString(), a.Notes, a.PenaltyAmount);
}
