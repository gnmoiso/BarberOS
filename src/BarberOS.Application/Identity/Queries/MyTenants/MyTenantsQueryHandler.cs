using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Identity.Queries.MyTenants;

internal sealed class MyTenantsQueryHandler(
    IUserRepository users,
    ITenantRepository tenants,
    IBarbershipSettingsRepository settings) : IQueryHandler<MyTenantsQuery, List<MyTenantDto>>
{
    public async Task<List<MyTenantDto>> Handle(MyTenantsQuery query, CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(query.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        if (user.TenantRoles.Count == 0) return [];

        var tenantList = await tenants.ListByIdsAsync(user.TenantRoles.Select(r => r.TenantId), ct);
        var tenantMap = tenantList.ToDictionary(t => t.Id);

        var result = new List<MyTenantDto>();
        foreach (var r in user.TenantRoles)
        {
            if (!tenantMap.TryGetValue(r.TenantId, out var tenant)) continue;
            var tenantSettings = await settings.GetByTenantAsync(r.TenantId, ct);
            result.Add(new MyTenantDto(r.TenantId, tenant.Name, tenant.Slug, r.Role.ToString(),
                tenant.Status.ToString(), tenantSettings?.LogoUrl));
        }
        return result;
    }
}
