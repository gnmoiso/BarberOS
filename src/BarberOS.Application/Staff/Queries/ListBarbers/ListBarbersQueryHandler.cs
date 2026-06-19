using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Staff.Commands.CreateBarber;

namespace BarberOS.Application.Staff.Queries.ListBarbers;

internal sealed class ListBarbersQueryHandler(
    IBarberRepository barbers,
    ITenantProvider tenantProvider) : IQueryHandler<ListBarbersQuery, IReadOnlyList<BarberResponse>>
{
    public async Task<IReadOnlyList<BarberResponse>> Handle(ListBarbersQuery query, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var list = await barbers.ListAsync(tenantId, ct);
        return list.Select(CreateBarberCommandHandler.ToResponse).ToList();
    }
}
