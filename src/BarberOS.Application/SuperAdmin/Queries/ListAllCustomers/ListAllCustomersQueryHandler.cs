using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.SuperAdmin.Queries.ListAllCustomers;

internal sealed class ListAllCustomersQueryHandler(
    ICustomerRepository customers,
    ITenantRepository tenants) : IQueryHandler<ListAllCustomersQuery, List<PlatformCustomerDto>>
{
    public async Task<List<PlatformCustomerDto>> Handle(ListAllCustomersQuery query, CancellationToken ct)
    {
        var allCustomers = await customers.ListAllAsync(ct);
        var allTenants = await tenants.ListAllAsync(ct);
        var tenantNames = allTenants.ToDictionary(t => t.Id, t => t.Name);

        return allCustomers
            .Select(c => new PlatformCustomerDto(
                c.Id, c.UserId, c.FullName, c.Phone, c.Email,
                c.TenantId, tenantNames.GetValueOrDefault(c.TenantId, "—"),
                c.CreatedAt))
            .ToList();
    }
}
