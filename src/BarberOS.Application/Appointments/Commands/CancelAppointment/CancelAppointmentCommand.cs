using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Commands.CancelAppointment;

public sealed record CancelAppointmentCommand(
    Guid AppointmentId,
    string Reason,
    bool CancelledByBarber,
    Guid CallerUserId,
    bool CallerIsBarber,
    Guid CallerTenantId) : ICommand<AppointmentResponse>;
