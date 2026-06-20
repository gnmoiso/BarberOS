using BarberOS.Domain.Common;
using BarberOS.Domain.Identity.Events;

namespace BarberOS.Domain.Identity;

public sealed class User : BaseGlobalAuditableEntity
{
    private User() { }

    private readonly List<RefreshToken> _refreshTokens = [];
    private readonly List<UserTenantRole> _tenantRoles = [];

    public string Email { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public bool IsSuperAdmin { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string? DisplayName { get; private set; }
    public string? AvatarUrl { get; private set; }
    public DateTimeOffset? EmailVerifiedAt { get; private set; }
    public UserStatus Status { get; private set; }
    public int FailedLoginCount { get; private set; }
    public DateTimeOffset? LockedUntil { get; private set; }

    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();
    public IReadOnlyCollection<UserTenantRole> TenantRoles => _tenantRoles.AsReadOnly();

    public static User Create(string email, string fullName, string passwordHash, bool isSuperAdmin = false)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        var user = new User
        {
            Email = email.Trim().ToLowerInvariant(),
            FullName = fullName.Trim(),
            PasswordHash = passwordHash,
            IsSuperAdmin = isSuperAdmin,
            Status = UserStatus.Active,
        };

        user.RaiseDomainEvent(new UserRegisteredEvent(user.Id, user.Email));
        return user;
    }

    public bool IsLockedOut(DateTimeOffset now) =>
        LockedUntil.HasValue && LockedUntil.Value > now;

    public void RecordFailedLogin(DateTimeOffset now)
    {
        FailedLoginCount++;
        LockedUntil = FailedLoginCount switch
        {
            >= 5 and < 10 => now.AddMinutes(1),
            >= 10 and < 15 => now.AddMinutes(5),
            >= 15 => now.AddMinutes(15),
            _ => null
        };
    }

    public void SetPhone(string? phone) => Phone = phone?.Trim();
    public void SetDisplayName(string? displayName) => DisplayName = string.IsNullOrWhiteSpace(displayName) ? null : displayName.Trim();
    public void SetAvatarUrl(string? avatarUrl) => AvatarUrl = avatarUrl;
    public void SetFullName(string fullName) => FullName = fullName.Trim();
    public void SetEmail(string email) => Email = email.Trim().ToLowerInvariant();
    public void SetPasswordHash(string passwordHash) => PasswordHash = passwordHash;

    /// <summary>Label shown next to anything this user authors (posts, comments) — role prefix + chosen nickname.</summary>
    public string DisplayLabel(Role? tenantRole)
    {
        var name = string.IsNullOrWhiteSpace(DisplayName) ? FullName : DisplayName!;
        var prefix = IsSuperAdmin ? "Dueño" : tenantRole switch
        {
            Role.Barber => "Barbero",
            Role.Customer => "Cliente",
            _ => "",
        };
        return string.IsNullOrEmpty(prefix) ? name : $"{prefix} {name}";
    }

    public void RecordSuccessfulLogin()
    {
        FailedLoginCount = 0;
        LockedUntil = null;
    }

    /// <summary>
    /// Returns the created role so the caller can also add it via the repository directly
    /// (db.Set&lt;UserTenantRole&gt;().Add) — EF's change tracker mis-detects client-generated-key
    /// entities discovered only through navigation fixup on an already-tracked User as Modified
    /// instead of Added, which fails with a DbUpdateConcurrencyException (0 rows affected).
    /// Returns null if the user already has this role for this tenant.
    /// </summary>
    public UserTenantRole? AddTenantRole(Guid tenantId, Role role, string? invitationCode = null)
    {
        if (_tenantRoles.Any(r => r.TenantId == tenantId && r.Role == role))
            return null;

        var tenantRole = UserTenantRole.Create(Id, tenantId, role, invitationCode);
        _tenantRoles.Add(tenantRole);
        return tenantRole;
    }

    public RefreshToken IssueRefreshToken(string tokenHash, string familyId, DateTimeOffset expiresAt, string createdIp)
    {
        var token = new RefreshToken
        {
            UserId = Id,
            TokenHash = tokenHash,
            FamilyId = familyId,
            ExpiresAt = expiresAt,
            CreatedIp = createdIp,
        };
        _refreshTokens.Add(token);
        return token;
    }

    public void RevokeTokenFamily(string familyId, DateTimeOffset now)
    {
        foreach (var token in _refreshTokens.Where(t => t.FamilyId == familyId))
        {
            token.Revoke(now);
        }
    }
}
