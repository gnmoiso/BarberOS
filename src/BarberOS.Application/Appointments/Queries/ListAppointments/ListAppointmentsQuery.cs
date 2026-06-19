using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Queries.ListAppointments;

public sealed record ListAppointmentsQuery(DateTimeOffset From, DateTimeOffset To, Guid? BarberId = null)
    : IQuery<IReadOnlyList<AppointmentResponse>>;
