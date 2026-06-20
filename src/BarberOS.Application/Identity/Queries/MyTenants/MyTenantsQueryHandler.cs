using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Identity.Queries.MyTenants;

internal sealed class MyTenantsQueryHandler(
    IUserRepository users,
    ITenantRepository tenants) : IQueryHandler<MyTenantsQuery, List<MyTenantDto>>
{
    public async Task<List<MyTenantDto>> Handle(MyTenantsQuery query, CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(query.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        if (user.TenantRoles.Count == 0) return [];

        var tenantList = await tenants.ListByIdsAsync(user.TenantRoles.Select(r => r.TenantId), ct);
        var tenantMap = tenantList.ToDictionary(t => t.Id);

        return user.TenantRoles
            .Where(r => tenantMap.ContainsKey(r.TenantId))
            .Select(r => new MyTenantDto(
                r.TenantId, tenantMap[r.TenantId].Name, tenantMap[r.TenantId].Slug, r.Role.ToString(),
                tenantMap[r.TenantId].Status.ToString()))
            .ToList();
    }
}
