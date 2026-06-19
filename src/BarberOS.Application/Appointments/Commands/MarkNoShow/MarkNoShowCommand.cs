using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Commands.MarkNoShow;

public sealed record MarkNoShowCommand(Guid AppointmentId) : ICommand<AppointmentResponse>;
