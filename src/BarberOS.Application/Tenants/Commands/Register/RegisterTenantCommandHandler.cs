using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;
using BarberOS.Domain.Tenants;

namespace BarberOS.Application.Tenants.Commands.Register;

internal sealed class RegisterTenantCommandHandler(
    ITenantRepository tenants,
    IUserRepository users,
    IPasswordHasher hasher,
    IJwtService jwt,
    IUnitOfWork uow) : ICommandHandler<RegisterTenantCommand, RegisterTenantResponse>
{
    public async Task<RegisterTenantResponse> Handle(RegisterTenantCommand cmd, CancellationToken ct)
    {
        if (await tenants.SlugExistsAsync(cmd.Slug, ct))
            throw new ConflictException("tenant.slug_taken", $"El slug '{cmd.Slug}' ya está en uso.");

        var existingUser = await users.FindByEmailAsync(cmd.OwnerEmail, ct);
        if (existingUser is not null)
            throw new ConflictException("auth.email_taken", "Ya existe una cuenta con ese correo.");

        var tenant = Tenant.Create(cmd.TenantName, cmd.Slug);
        var passwordHash = hasher.Hash(cmd.OwnerPassword);
        var user = User.Create(cmd.OwnerEmail, cmd.OwnerFullName, passwordHash);

        user.AddTenantRole(tenant.Id, Role.Owner);

        tenants.Add(tenant);
        users.Add(user);

        var accessToken = jwt.GenerateAccessToken(user.Id, tenant.Id, [Role.Owner.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();
        user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, cmd.IpAddress);

        await uow.SaveChangesAsync(ct);

        return new RegisterTenantResponse(
            TenantId: tenant.Id,
            Slug: tenant.Slug,
            AccessToken: accessToken.Token,
            RefreshToken: refreshResult.RawToken,
            AccessTokenExpiresAt: accessToken.ExpiresAt);
    }
}
