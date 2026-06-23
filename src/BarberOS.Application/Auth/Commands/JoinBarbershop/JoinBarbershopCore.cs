using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Barbershop;
using BarberOS.Domain.Common;
using BarberOS.Domain.Customers;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Auth.Commands.JoinBarbershop;

/// <summary>
/// Shared membership-creation logic for joining a barbershop, used by both the
/// raw-code flow (<see cref="JoinBarbershopCommandHandler"/>) and the QR/deep-link
/// token flow (JoinBarbershopByTokenCommandHandler) so the invitation code's text
/// never has to round-trip through a URL.
/// </summary>
internal static class JoinBarbershopCore
{
    public static async Task<JoinBarbershopResponse> ExecuteAsync(
        InvitationCode code,
        Guid userId,
        IUserRepository users,
        ICustomerRepository customers,
        ITenantRepository tenants,
        IJwtService jwt,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(userId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        if (user.TenantRoles.Any(r => r.TenantId == code.TenantId))
            throw new ConflictException("membership.exists", "Ya eres miembro de esta barbería.");

        var tenant = await tenants.FindByIdAsync(code.TenantId, ct)
            ?? throw new NotFoundException("tenant.not_found", "Barbería no encontrada.");

        var tenantRole = user.AddTenantRole(code.TenantId, Role.Customer, code.Code);
        if (tenantRole is not null) users.AddTenantRole(tenantRole);
        code.RecordUsage();

        var existingCustomer = await customers.FindByUserIdAsync(code.TenantId, user.Id, ct);
        if (existingCustomer is null)
        {
            var phone = user.Phone ?? $"sin-tel-{user.Id:N}"[..30];
            customers.Add(Customer.Create(code.TenantId, user.FullName, phone, user.Email, user.Id));
        }

        var accessToken = jwt.GenerateAccessToken(user.Id, code.TenantId, [Role.Customer.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();
        var refreshToken = user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, "web");
        users.AddRefreshToken(refreshToken);

        await uow.SaveChangesAsync(ct);

        return new JoinBarbershopResponse(
            TenantId: code.TenantId,
            TenantName: tenant.Name,
            TenantSlug: tenant.Slug,
            AccessToken: accessToken.Token,
            RefreshToken: refreshResult.RawToken,
            AccessTokenExpiresAt: accessToken.ExpiresAt);
    }
}
