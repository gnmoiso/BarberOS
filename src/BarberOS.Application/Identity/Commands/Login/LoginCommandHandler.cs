using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Identity.Commands.Login;

internal sealed class LoginCommandHandler(
    IUserRepository users,
    IPasswordHasher hasher,
    IJwtService jwt,
    IDateTimeProvider clock,
    IUnitOfWork uow) : ICommandHandler<LoginCommand, LoginResponse>
{
    public async Task<LoginResponse> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await users.FindByEmailAsync(cmd.Email, ct)
            ?? throw new UnauthorizedException("auth.invalid_credentials", "Credenciales inválidas.");

        if (user.IsLockedOut(clock.UtcNow))
            throw new ForbiddenException("auth.account_locked", "Cuenta bloqueada temporalmente. Intente más tarde.");

        if (!hasher.Verify(cmd.Password, user.PasswordHash))
        {
            user.RecordFailedLogin(clock.UtcNow);
            throw new UnauthorizedException("auth.invalid_credentials", "Credenciales inválidas.");
        }

        var membership = user.TenantRoles.FirstOrDefault(r => r.TenantId == cmd.TenantId)
            ?? throw new ForbiddenException("auth.no_membership", "El usuario no pertenece a este tenant.");

        user.RecordSuccessfulLogin();

        var accessToken = jwt.GenerateAccessToken(user.Id, cmd.TenantId, [membership.Role.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();

        user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, cmd.IpAddress);

        await uow.SaveChangesAsync(ct);

        return new LoginResponse(
            AccessToken: accessToken.Token,
            RefreshToken: refreshResult.RawToken,
            AccessTokenExpiresAt: accessToken.ExpiresAt,
            UserId: user.Id,
            FullName: user.FullName,
            Email: user.Email,
            Role: membership.Role.ToString());
    }
}
