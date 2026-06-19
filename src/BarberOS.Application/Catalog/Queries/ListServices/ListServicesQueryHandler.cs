using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Catalog.Commands.CreateService;

namespace BarberOS.Application.Catalog.Queries.ListServices;

internal sealed class ListServicesQueryHandler(
    IServiceRepository services,
    ITenantProvider tenantProvider) : IQueryHandler<ListServicesQuery, IReadOnlyList<ServiceResponse>>
{
    public async Task<IReadOnlyList<ServiceResponse>> Handle(ListServicesQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var list = await services.ListAsync(tenantId, ct);
        return list.Select(CreateServiceCommandHandler.ToResponse).ToList();
    }
}
