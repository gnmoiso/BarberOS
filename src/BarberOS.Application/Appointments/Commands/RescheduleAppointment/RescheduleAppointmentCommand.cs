using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Commands.RescheduleAppointment;

public sealed record RescheduleAppointmentCommand(Guid AppointmentId, Guid BarberId, DateTimeOffset NewStartsAt) : ICommand<AppointmentResponse>;
