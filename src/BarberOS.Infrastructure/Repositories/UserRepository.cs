using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Identity;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class UserRepository(AppDbContext db) : IUserRepository
{
    // IgnoreQueryFilters() is required here — UserTenantRole has a global query filter that scopes
    // it to the caller's *currently active* JWT tenant (see AppDbContext.OnModelCreating). That
    // filter is meant for tenant-scoped business listings, but Include()-ing TenantRoles silently
    // applies it too, so a multi-barbershop user's OTHER memberships became invisible the moment
    // they had an active tenant context (login itself is unaffected: pre-login there's no ambient
    // tenant, so the filter is a no-op then) — this broke refresh-token, switch-tenant, my-tenants,
    // and join-barbershop for any account belonging to more than one tenant (23.14.5/23.14.9).
    public Task<User?> FindByEmailAsync(string email, CancellationToken ct) =>
        db.Users
            .IgnoreQueryFilters()
            .Include(u => u.TenantRoles)
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant() && !u.IsDeleted, ct);

    public Task<User?> FindByPhoneAsync(string phone, CancellationToken ct) =>
        db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Phone == phone && !u.IsDeleted, ct);

    public Task<User?> FindByIdWithRolesAsync(Guid id, CancellationToken ct) =>
        db.Users
            .IgnoreQueryFilters()
            .Include(u => u.TenantRoles)
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);

    public Task<List<User>> FindManyWithRolesAsync(IEnumerable<Guid> ids, CancellationToken ct) =>
        db.Users
            .IgnoreQueryFilters()
            .Include(u => u.TenantRoles)
            .Where(u => ids.Contains(u.Id) && !u.IsDeleted)
            .ToListAsync(ct);

    public Task<User?> FindByRefreshTokenAsync(string tokenHash, CancellationToken ct) =>
        db.Users
            .IgnoreQueryFilters()
            .Include(u => u.TenantRoles)
            .Include(u => u.RefreshTokens.Where(t => t.TokenHash == tokenHash))
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.TokenHash == tokenHash) && !u.IsDeleted, ct);

    public void Add(User user) => db.Users.Add(user);
    public void AddRefreshToken(RefreshToken token) => db.RefreshTokens.Add(token);
    public void AddTenantRole(UserTenantRole tenantRole) => db.Set<UserTenantRole>().Add(tenantRole);

    public async Task<Dictionary<Role, int>> CountTenantMembersByRoleAsync(Guid tenantId, CancellationToken ct)
    {
        var grouped = await db.Set<UserTenantRole>()
            .Where(r => r.TenantId == tenantId)
            .GroupBy(r => r.Role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        return grouped.ToDictionary(g => g.Role, g => g.Count);
    }

    public async Task<List<(User User, Role Role)>> ListTenantMembersAsync(Guid tenantId, CancellationToken ct)
    {
        var rows = await db.Set<UserTenantRole>()
            .Where(r => r.TenantId == tenantId)
            .Join(db.Users, r => r.UserId, u => u.Id, (r, u) => new { u, r.Role })
            .ToListAsync(ct);
        return rows.Select(x => (x.u, x.Role)).ToList();
    }

    public Task<bool> IsPreferredCustomerAsync(Guid tenantId, Guid userId, CancellationToken ct) =>
        db.Set<UserTenantRole>()
            .Where(r => r.TenantId == tenantId && r.UserId == userId && r.Role == Role.Customer)
            .Select(r => r.IsPreferred)
            .FirstOrDefaultAsync(ct);

    public Task<List<string?>> ListAllPhonesAsync(CancellationToken ct) =>
        db.Users.IgnoreQueryFilters().Select(u => u.Phone).ToListAsync(ct);
}
