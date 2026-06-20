using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Identity.Commands.SwitchTenant;

internal sealed class SwitchTenantCommandHandler(
    IUserRepository users,
    ITenantRepository tenants,
    IJwtService jwt,
    IUnitOfWork uow) : ICommandHandler<SwitchTenantCommand, SwitchTenantResponse>
{
    public async Task<SwitchTenantResponse> Handle(SwitchTenantCommand cmd, CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        var membership = user.TenantRoles.FirstOrDefault(r => r.TenantId == cmd.TenantId)
            ?? throw new ForbiddenException("auth.no_membership", "No eres miembro de esa barbería.");

        var tenant = await tenants.FindByIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("tenant.not_found", "Barbería no encontrada.");

        var accessToken = jwt.GenerateAccessToken(user.Id, tenant.Id, [membership.Role.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();
        users.AddRefreshToken(user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, cmd.IpAddress));

        await uow.SaveChangesAsync(ct);

        var licensePending = membership.Role == Domain.Identity.Role.Barber && tenant.LicenseExpiresAt is null;

        return new SwitchTenantResponse(
            accessToken.Token, refreshResult.RawToken, accessToken.ExpiresAt,
            user.Id, user.FullName, user.Email, membership.Role.ToString(),
            tenant.Id, tenant.Slug, licensePending);
    }
}
