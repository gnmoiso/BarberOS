using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Identity.Commands.LeaveTenant;

internal sealed class LeaveTenantCommandHandler(
    IUserRepository users,
    ITenantRepository tenants,
    ICustomerRepository customers,
    IJwtService jwt,
    IUnitOfWork uow) : ICommandHandler<LeaveTenantCommand, LeaveTenantResponse>
{
    public async Task<LeaveTenantResponse> Handle(LeaveTenantCommand cmd, CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        var membership = user.TenantRoles.FirstOrDefault(r => r.TenantId == cmd.TenantId)
            ?? throw new NotFoundException("membership.not_found", "No eres miembro de esa barbería.");

        // Only customers can leave on their own — a Barber leaving would orphan the
        // barbershop they own; that's handled separately (SuperAdmin deleting the tenant).
        if (membership.Role != Role.Customer)
            throw new ForbiddenException("membership.barber_cannot_leave", "Un barbero no puede salir de su propia barbería.");

        users.RemoveTenantRole(membership);

        var customer = await customers.FindByUserIdAsync(cmd.TenantId, user.Id, ct);
        if (customer is not null) customer.IsDeleted = true;

        // If they were actively viewing this tenant, switch to another one they still belong
        // to, or fall back to the same "no tenant yet" state a freshly-registered customer is
        // in — never leave them holding a token whose tenant_id claim points at a membership
        // that no longer exists.
        Guid? newTenantId = null;
        string? newTenantSlug = null;
        if (cmd.CurrentActiveTenantId == cmd.TenantId)
        {
            var remaining = user.TenantRoles.FirstOrDefault(r => r.TenantId != cmd.TenantId);
            if (remaining is not null)
            {
                var remainingTenant = await tenants.FindByIdAsync(remaining.TenantId, ct);
                newTenantId = remainingTenant?.Id;
                newTenantSlug = remainingTenant?.Slug;
            }
        }
        else
        {
            newTenantId = cmd.CurrentActiveTenantId;
            if (newTenantId.HasValue)
                newTenantSlug = (await tenants.FindByIdAsync(newTenantId.Value, ct))?.Slug;
        }

        var accessToken = jwt.GenerateAccessToken(user.Id, newTenantId, [Role.Customer.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();
        users.AddRefreshToken(user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, cmd.IpAddress));

        await uow.SaveChangesAsync(ct);

        return new LeaveTenantResponse(
            accessToken.Token, refreshResult.RawToken, accessToken.ExpiresAt,
            user.Id, user.FullName, user.Email, Role.Customer.ToString(),
            newTenantId, newTenantSlug);
    }
}
