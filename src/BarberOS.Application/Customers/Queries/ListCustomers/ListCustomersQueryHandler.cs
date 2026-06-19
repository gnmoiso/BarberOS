using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Customers.Commands.CreateCustomer;

namespace BarberOS.Application.Customers.Queries.ListCustomers;

internal sealed class ListCustomersQueryHandler(
    ICustomerRepository customers,
    ITenantProvider tenantProvider) : IQueryHandler<ListCustomersQuery, PagedResult<CustomerResponse>>
{
    public async Task<PagedResult<CustomerResponse>> Handle(ListCustomersQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var items = await customers.SearchAsync(tenantId, query.Query, query.Page, query.Size, ct);
        var total = await customers.CountAsync(tenantId, query.Query, ct);
        return new PagedResult<CustomerResponse>(
            items.Select(CreateCustomerCommandHandler.ToResponse).ToList(),
            total, query.Page, query.Size);
    }
}
