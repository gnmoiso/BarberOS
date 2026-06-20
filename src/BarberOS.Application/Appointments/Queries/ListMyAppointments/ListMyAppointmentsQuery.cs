using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Queries.ListMyAppointments;

public sealed record ListMyAppointmentsQuery(Guid CallerUserId) : IQuery<IReadOnlyList<AppointmentResponse>>;
