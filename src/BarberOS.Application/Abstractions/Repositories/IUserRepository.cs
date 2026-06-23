using BarberOS.Domain.Identity;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IUserRepository
{
    Task<User?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> FindByPhoneAsync(string phone, CancellationToken ct = default);
    Task<User?> FindByIdWithRolesAsync(Guid id, CancellationToken ct = default);
    Task<List<User>> FindManyWithRolesAsync(IEnumerable<Guid> ids, CancellationToken ct = default);

    /// <summary>Finds a user and eagerly loads the refresh token matching <paramref name="tokenHash"/>.</summary>
    Task<User?> FindByRefreshTokenAsync(string tokenHash, CancellationToken ct = default);

    void Add(User user);
    void AddRefreshToken(RefreshToken token);
    void AddTenantRole(UserTenantRole tenantRole);

    /// <summary>Counts members of a tenant grouped by role (Barber/Customer), keyed by <see cref="Role"/>.</summary>
    Task<Dictionary<Role, int>> CountTenantMembersByRoleAsync(Guid tenantId, CancellationToken ct = default);

    /// <summary>Lists every user who has a role within the given tenant, paired with that role.</summary>
    Task<List<(User User, Role Role)>> ListTenantMembersAsync(Guid tenantId, CancellationToken ct = default);

    /// <summary>Whether this user is marked as a preferred customer of this tenant (bypasses the
    /// advance-booking-window rule — 23.15.2).</summary>
    Task<bool> IsPreferredCustomerAsync(Guid tenantId, Guid userId, CancellationToken ct = default);

    Task<List<string?>> ListAllPhonesAsync(CancellationToken ct = default);
}
