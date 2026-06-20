using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.ExtendLicense;

internal sealed class ExtendLicenseCommandHandler(
    IBarbershipLicenseRepository licenses,
    IUnitOfWork uow) : ICommandHandler<ExtendLicenseCommand>
{
    public async Task<Unit> Handle(ExtendLicenseCommand cmd, CancellationToken ct)
    {
        var license = await licenses.FindByIdAsync(cmd.LicenseId, ct)
            ?? throw new NotFoundException("license.not_found", "Licencia no encontrada.");

        license.ExtendExpiration(cmd.NewExpiresAt);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
