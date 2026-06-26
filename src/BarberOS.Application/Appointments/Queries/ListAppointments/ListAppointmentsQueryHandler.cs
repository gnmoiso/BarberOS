using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments.Commands.BookAppointment;

namespace BarberOS.Application.Appointments.Queries.ListAppointments;

internal sealed class ListAppointmentsQueryHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IRatingRepository ratings,
    ITenantProvider tenantProvider) : IQueryHandler<ListAppointmentsQuery, IReadOnlyList<AppointmentResponse>>
{
    public async Task<IReadOnlyList<AppointmentResponse>> Handle(ListAppointmentsQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var list = await appointments.ListByDateRangeAsync(tenantId, query.From, query.To, query.BarberId, ct);

        if (query.RestrictToCaller)
        {
            var ownCustomer = await customers.FindByUserIdAsync(tenantId, query.CallerUserId, ct);
            list = ownCustomer is null ? [] : list.Where(a => a.CustomerId == ownCustomer.Id).ToList();
        }

        var result = new List<AppointmentResponse>();
        foreach (var a in list)
        {
            var customer = await customers.FindByIdAsync(a.CustomerId, ct);
            var barber = await barbers.FindByIdAsync(a.BarberId, ct);
            // Not gated on Status == Completed — a customer can rate (and therefore have
            // already rated) an appointment the barber never advanced past Confirmed/InProgress.
            var isRated = await ratings.FindServiceRatingByAppointmentAsync(a.Id, ct) is not null;
            result.Add(BookAppointmentCommandHandler.ToResponse(
                a, customer?.FullName ?? "Unknown", barber?.DisplayName ?? "Unknown", isRated));
        }
        return result;
    }
}
