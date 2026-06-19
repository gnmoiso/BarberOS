using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Queries.ListAppointments;

internal sealed class ListAppointmentsQueryHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    ITenantProvider tenantProvider) : IQueryHandler<ListAppointmentsQuery, IReadOnlyList<AppointmentResponse>>
{
    public async Task<IReadOnlyList<AppointmentResponse>> Handle(ListAppointmentsQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var list = await appointments.ListByDateRangeAsync(tenantId, query.From, query.To, query.BarberId, ct);

        var result = new List<AppointmentResponse>();
        foreach (var a in list)
        {
            var customer = await customers.FindByIdAsync(a.CustomerId, ct);
            var barber = await barbers.FindByIdAsync(a.BarberId, ct);
            result.Add(BookAppointmentCommandHandler.ToResponse(
                a, customer?.FullName ?? "Unknown", barber?.DisplayName ?? "Unknown"));
        }
        return result;
    }
}
