using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Identity.Queries.MyTenants;

public sealed record MyTenantsQuery(Guid UserId) : IQuery<List<MyTenantDto>>;

public sealed record MyTenantDto(Guid TenantId, string Name, string Slug, string Role, string Status);
