using BarberOS.Domain.Common;

namespace BarberOS.Domain.Identity;

public sealed class UserTenantRole : BaseEntity
{
    private UserTenantRole() { }

    public Guid UserId { get; private set; }
    public Guid TenantId { get; private set; }
    public Role Role { get; private set; }
    public string? InvitationCodeUsed { get; private set; }
    public bool IsPreferred { get; private set; }
    public int PenaltyPercentage { get; private set; }

    public static UserTenantRole Create(Guid userId, Guid tenantId, Role role, string? invitationCode = null) =>
        new() { UserId = userId, TenantId = tenantId, Role = role, InvitationCodeUsed = invitationCode };

    public void SetPreferred(bool preferred) => IsPreferred = preferred;
    public void SetPenalty(int percentage) => PenaltyPercentage = Math.Clamp(percentage, 0, 100);
}
