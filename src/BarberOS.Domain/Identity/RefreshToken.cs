using BarberOS.Domain.Common;

namespace BarberOS.Domain.Identity;

public sealed class RefreshToken : BaseEntity
{
    internal RefreshToken() { }

    public Guid UserId { get; init; }

    /// <summary>SHA-256 of the raw opaque token — never store the raw token.</summary>
    public string TokenHash { get; init; } = string.Empty;

    /// <summary>Tokens sharing a family are revoked together on reuse detection.</summary>
    public string FamilyId { get; init; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; init; }
    public DateTimeOffset? UsedAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string CreatedIp { get; init; } = string.Empty;

    public bool IsActive => UsedAt is null && RevokedAt is null;

    public void MarkAsUsed(DateTimeOffset now) => UsedAt = now;

    public void Revoke(DateTimeOffset now) => RevokedAt = now;
}
