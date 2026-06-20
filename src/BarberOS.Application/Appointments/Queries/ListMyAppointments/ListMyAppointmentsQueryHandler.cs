using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments.Commands.BookAppointment;
using BarberOS.Domain.Appointments;

namespace BarberOS.Application.Appointments.Queries.ListMyAppointments;

internal sealed class ListMyAppointmentsQueryHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IRatingRepository ratings,
    ITenantRepository tenants) : IQueryHandler<ListMyAppointmentsQuery, IReadOnlyList<AppointmentResponse>>
{
    // 23.16.6 — "Mis citas" spans every barbershop the customer belongs to, not just the one
    // currently active, and each entry is tagged with which barbershop it came from.
    public async Task<IReadOnlyList<AppointmentResponse>> Handle(ListMyAppointmentsQuery query, CancellationToken ct)
    {
        var myCustomers = await customers.ListByUserIdAcrossTenantsAsync(query.CallerUserId, ct);
        if (myCustomers.Count == 0) return [];

        var customerById = myCustomers.ToDictionary(c => c.Id);
        var history = await appointments.ListByCustomerIdsAsync(customerById.Keys.ToList(), page: 1, size: 200, ct);

        var tenantList = await tenants.ListByIdsAsync(myCustomers.Select(c => c.TenantId).Distinct(), ct);
        var tenantNameMap = tenantList.ToDictionary(t => t.Id, t => t.Name);

        var result = new List<AppointmentResponse>(history.Count);
        foreach (var a in history)
        {
            var barber = await barbers.FindByIdAsync(a.BarberId, ct);
            var isRated = a.Status == AppointmentStatus.Completed
                && await ratings.FindServiceRatingByAppointmentAsync(a.Id, ct) is not null;
            var customerName = customerById[a.CustomerId].FullName;
            var tenantName = tenantNameMap.GetValueOrDefault(a.TenantId, "Barbería");
            result.Add(BookAppointmentCommandHandler.ToResponse(a, customerName, barber?.DisplayName ?? "Unknown", isRated, tenantName));
        }
        return result;
    }
}
