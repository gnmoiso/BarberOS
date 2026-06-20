using BarberOS.Domain.Common;

namespace BarberOS.Domain.Barbershop;

/// <summary>
/// 10-character alphanumeric code issued by a barbershop to invite customers.
/// The barber shares this code privately with clients to avoid fake accounts.
/// </summary>
public sealed class InvitationCode : BaseAuditableEntity
{
    private InvitationCode() { }

    public string Code { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public int UsageCount { get; private set; }
    public string? Label { get; private set; }

    public static InvitationCode Create(Guid tenantId, string code, string? label = null) =>
        new() { TenantId = tenantId, Code = code.ToUpperInvariant(), Label = label };

    public void RecordUsage() => UsageCount++;
    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
