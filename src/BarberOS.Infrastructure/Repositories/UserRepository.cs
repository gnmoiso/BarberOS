using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Identity;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> FindByEmailAsync(string email, CancellationToken ct) =>
        db.Users
            .Include(u => u.TenantRoles)
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), ct);

    public Task<User?> FindByIdWithRolesAsync(Guid id, CancellationToken ct) =>
        db.Users
            .Include(u => u.TenantRoles)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> FindByRefreshTokenAsync(string tokenHash, CancellationToken ct) =>
        db.Users
            .Include(u => u.TenantRoles)
            .Include(u => u.RefreshTokens.Where(t => t.TokenHash == tokenHash))
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.TokenHash == tokenHash), ct);

    public void Add(User user) => db.Users.Add(user);
}
