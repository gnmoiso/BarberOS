using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Customers;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Auth.Commands.JoinBarbershop;

internal sealed class JoinBarbershopCommandHandler(
    IUserRepository users,
    IInvitationCodeRepository codes,
    ITenantRepository tenants,
    ICustomerRepository customers,
    IJwtService jwt,
    IUnitOfWork uow) : ICommandHandler<JoinBarbershopCommand, JoinBarbershopResponse>
{
    public async Task<JoinBarbershopResponse> Handle(JoinBarbershopCommand cmd, CancellationToken ct)
    {
        var code = await codes.FindByCodeAsync(cmd.InvitationCode, ct)
            ?? throw new NotFoundException("code.not_found", "Código de invitación inválido o inactivo.");

        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        // Check user not already in this tenant
        if (user.TenantRoles.Any(r => r.TenantId == code.TenantId))
            throw new ConflictException("membership.exists", "Ya eres miembro de esta barbería.");

        var tenant = await tenants.FindByIdAsync(code.TenantId, ct)
            ?? throw new NotFoundException("tenant.not_found", "Barbería no encontrada.");

        var tenantRole = user.AddTenantRole(code.TenantId, Role.Customer, cmd.InvitationCode);
        if (tenantRole is not null) users.AddTenantRole(tenantRole);
        code.RecordUsage();

        // Every customer member gets a linked CRM Customer record so appointment booking
        // can resolve "the logged-in user" to a bookable customer without manual selection.
        var existingCustomer = await customers.FindByUserIdAsync(code.TenantId, user.Id, ct);
        if (existingCustomer is null)
        {
            // The shared literal "Sin teléfono" used to be the fallback for users with no phone on
            // file, but (TenantId, Phone) is unique — the second phoneless customer joining the same
            // barbershop crashed with a 23505 duplicate-key violation. Fall back to something unique
            // per user instead.
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
