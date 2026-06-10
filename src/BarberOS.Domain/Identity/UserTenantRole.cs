using BarberOS.Domain.Common;

namespace BarberOS.Domain.Identity;

public sealed class UserTenantRole : BaseEntity
{
    private UserTenantRole() { }

    public Guid UserId { get; private set; }
    public Guid TenantId { get; private set; }
    public Role Role { get; private set; }

    public static UserTenantRole Create(Guid userId, Guid tenantId, Role role) =>
        new() { UserId = userId, TenantId = tenantId, Role = role };
}
