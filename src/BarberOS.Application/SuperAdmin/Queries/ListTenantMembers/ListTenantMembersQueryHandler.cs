using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.SuperAdmin.Queries.ListTenantMembers;

internal sealed class ListTenantMembersQueryHandler(
    IUserRepository users) : IQueryHandler<ListTenantMembersQuery, List<TenantMemberDto>>
{
    public async Task<List<TenantMemberDto>> Handle(ListTenantMembersQuery query, CancellationToken ct)
    {
        var members = await users.ListTenantMembersAsync(query.TenantId, ct);
        return members
            .Select(m => new TenantMemberDto(m.User.Id, m.User.FullName, m.User.Email, m.Role.ToString()))
            .OrderBy(m => m.Role)
            .ThenBy(m => m.FullName)
            .ToList();
    }
}
