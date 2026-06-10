using BarberOS.Domain.Identity;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IUserRepository
{
    Task<User?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> FindByIdWithRolesAsync(Guid id, CancellationToken ct = default);

    /// <summary>Finds a user and eagerly loads the refresh token matching <paramref name="tokenHash"/>.</summary>
    Task<User?> FindByRefreshTokenAsync(string tokenHash, CancellationToken ct = default);

    void Add(User user);
}
