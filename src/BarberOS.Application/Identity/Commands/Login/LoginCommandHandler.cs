using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Identity.Commands.Login;

internal sealed class LoginCommandHandler(
    IUserRepository users,
    ITenantRepository tenants,
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
            throw new ForbiddenException("auth.account_locked", "Cuenta bloqueada temporalmente.");

        if (!hasher.Verify(cmd.Password, user.PasswordHash))
        {
            user.RecordFailedLogin(clock.UtcNow);
            await uow.SaveChangesAsync(ct);
            throw new UnauthorizedException("auth.invalid_credentials", "Credenciales inválidas.");
        }

        user.RecordSuccessfulLogin();

        // SuperAdmin: sin scope de tenant
        if (user.IsSuperAdmin)
        {
            var at = jwt.GenerateAccessToken(user.Id, null, [Role.SuperAdmin.ToString()]);
            var rr = jwt.GenerateRefreshToken();
            users.AddRefreshToken(user.IssueRefreshToken(rr.TokenHash, rr.FamilyId, rr.ExpiresAt, cmd.IpAddress));
            await uow.SaveChangesAsync(ct);
            return new LoginResponse(at.Token, rr.RawToken, at.ExpiresAt, user.Id, user.FullName, user.Email,
                Role.SuperAdmin.ToString(), null, null, false);
        }

        // Customer sin barbería aún: token sin scope
        if (!user.TenantRoles.Any())
        {
            var at = jwt.GenerateAccessToken(user.Id, null, [Role.Customer.ToString()]);
            var rr = jwt.GenerateRefreshToken();
            users.AddRefreshToken(user.IssueRefreshToken(rr.TokenHash, rr.FamilyId, rr.ExpiresAt, cmd.IpAddress));
            await uow.SaveChangesAsync(ct);
            return new LoginResponse(at.Token, rr.RawToken, at.ExpiresAt, user.Id, user.FullName, user.Email,
                Role.Customer.ToString(), null, null, false);
        }

        // Barber o Customer con membership de tenant
        UserTenantRole membership;
        if (cmd.TenantId.HasValue)
        {
            membership = user.TenantRoles.FirstOrDefault(r => r.TenantId == cmd.TenantId.Value)
                ?? throw new ForbiddenException("auth.no_membership", "No eres miembro de esa barbería.");
        }
        else
        {
            membership = user.TenantRoles.First();
        }

        var tenantId = membership.TenantId;
        var accessToken = jwt.GenerateAccessToken(user.Id, tenantId, [membership.Role.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();
        users.AddRefreshToken(user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, cmd.IpAddress));

        var tenant = await tenants.FindByIdAsync(tenantId, ct);
        await uow.SaveChangesAsync(ct);

        var licensePending = membership.Role == Role.Barber && tenant is { LicenseExpiresAt: null };

        return new LoginResponse(accessToken.Token, refreshResult.RawToken, accessToken.ExpiresAt,
            user.Id, user.FullName, user.Email, membership.Role.ToString(), tenantId, tenant?.Slug, licensePending);
    }
}
