using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Identity.Commands.RefreshToken;

internal sealed class RefreshTokenCommandHandler(
    IUserRepository users,
    IJwtService jwt,
    IDateTimeProvider clock,
    IUnitOfWork uow) : ICommandHandler<RefreshTokenCommand, RefreshTokenResponse>
{
    public async Task<RefreshTokenResponse> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var tokenHash = jwt.HashToken(cmd.RawToken);
        var user = await users.FindByRefreshTokenAsync(tokenHash, ct)
            ?? throw new UnauthorizedException("auth.invalid_token", "Token de renovación inválido.");

        var token = user.RefreshTokens.First(t => t.TokenHash == tokenHash);

        if (!token.IsActive || token.ExpiresAt < clock.UtcNow)
        {
            // Token already used or expired → possible theft; revoke entire family
            user.RevokeTokenFamily(token.FamilyId, clock.UtcNow);
            throw new UnauthorizedException("auth.token_reuse", "Token de renovación inválido.");
        }

        token.MarkAsUsed(clock.UtcNow);

        // Determine tenant and roles from existing token's last access context
        var latestRole = user.TenantRoles.FirstOrDefault();
        Guid? tenantId = latestRole?.TenantId;
        IEnumerable<string> roles = latestRole is not null ? [latestRole.Role.ToString()] : [];

        var accessToken = jwt.GenerateAccessToken(user.Id, tenantId, roles);
        var newRefresh = jwt.RotateRefreshToken(token.FamilyId);

        var newToken = user.IssueRefreshToken(newRefresh.TokenHash, newRefresh.FamilyId, newRefresh.ExpiresAt, cmd.IpAddress);
        users.AddRefreshToken(newToken);

        await uow.SaveChangesAsync(ct);

        return new RefreshTokenResponse(accessToken.Token, newRefresh.RawToken, accessToken.ExpiresAt);
    }
}
