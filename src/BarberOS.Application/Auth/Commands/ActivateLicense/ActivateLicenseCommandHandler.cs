using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Auth.Commands.ActivateLicense;

internal sealed class ActivateLicenseCommandHandler(
    IUserRepository users,
    ITenantRepository tenants,
    IBarbershipLicenseRepository licenses,
    IDateTimeProvider clock,
    IUnitOfWork uow) : ICommandHandler<ActivateLicenseCommand, ActivateLicenseResponse>
{
    public async Task<ActivateLicenseResponse> Handle(ActivateLicenseCommand cmd, CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("auth.user_not_found", "Usuario no encontrado.");

        var membership = user.TenantRoles.FirstOrDefault(r => r.Role == Role.Barber)
            ?? throw new ForbiddenException("auth.not_a_barber", "Solo los barberos pueden activar una licencia.");

        var tenant = await tenants.FindByIdAsync(membership.TenantId, ct)
            ?? throw new NotFoundException("tenant.not_found", "Barbería no encontrada.");

        var license = await licenses.FindByCodeAsync(cmd.LicenseCode, ct)
            ?? throw new NotFoundException("license.not_found", "Código de licencia inválido.");

        if (license.IsAssigned)
            throw new ConflictException("license.already_used", "Este código de licencia ya está en uso.");

        if (license.IsExpired(clock.UtcNow))
            throw new ForbiddenException("license.expired", "El código de licencia ha expirado.");

        license.AssignToTenant(tenant.Id);
        tenant.SetLicense(cmd.LicenseCode, license.ExpiresAt);

        await uow.SaveChangesAsync(ct);

        return new ActivateLicenseResponse(tenant.Id, license.ExpiresAt);
    }
}
