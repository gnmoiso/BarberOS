using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Commands.UpdateAppointmentStatus;

public enum AppointmentStatusAction { Confirm, Start, Complete }

public sealed record UpdateAppointmentStatusCommand(Guid AppointmentId, AppointmentStatusAction Action) : ICommand<AppointmentResponse>;
