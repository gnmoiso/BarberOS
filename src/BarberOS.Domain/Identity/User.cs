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
    public string PasswordHash { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public DateTimeOffset? EmailVerifiedAt { get; private set; }
    public UserStatus Status { get; private set; }
    public int FailedLoginCount { get; private set; }
    public DateTimeOffset? LockedUntil { get; private set; }

    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();
    public IReadOnlyCollection<UserTenantRole> TenantRoles => _tenantRoles.AsReadOnly();

    public static User Create(string email, string fullName, string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        var user = new User
        {
            Email = email.Trim().ToLowerInvariant(),
            FullName = fullName.Trim(),
            PasswordHash = passwordHash,
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

    public void RecordSuccessfulLogin()
    {
        FailedLoginCount = 0;
        LockedUntil = null;
    }

    public void AddTenantRole(Guid tenantId, Role role)
    {
        if (_tenantRoles.Any(r => r.TenantId == tenantId && r.Role == role))
            return;

        _tenantRoles.Add(UserTenantRole.Create(Id, tenantId, role));
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
