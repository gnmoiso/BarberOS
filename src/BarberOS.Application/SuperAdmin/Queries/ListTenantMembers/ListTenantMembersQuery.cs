using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.ListTenantMembers;

public sealed record ListTenantMembersQuery(Guid TenantId) : IQuery<List<TenantMemberDto>>;

public sealed record TenantMemberDto(Guid UserId, string FullName, string Email, string Role);
