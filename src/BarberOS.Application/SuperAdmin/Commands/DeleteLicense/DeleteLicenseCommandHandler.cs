using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.DeleteLicense;

internal sealed class DeleteLicenseCommandHandler(
    IBarbershipLicenseRepository licenses,
    ITenantRepository tenants,
    IUnitOfWork uow) : ICommandHandler<DeleteLicenseCommand>
{
    public async Task<Unit> Handle(DeleteLicenseCommand cmd, CancellationToken ct)
    {
        var license = await licenses.FindByIdAsync(cmd.LicenseId, ct)
            ?? throw new NotFoundException("license.not_found", "Licencia no encontrada.");

        if (license.TenantId is Guid tenantId)
        {
            var tenant = await tenants.FindByIdAsync(tenantId, ct);
            tenant?.RevokeLicense();
        }

        license.IsDeleted = true;
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
