using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using DomainBarbershipSettings = BarberOS.Domain.Barbershop.BarbershipSettings;

namespace BarberOS.Application.BarbershipSettings.Commands.SetBarbershipLogo;

internal sealed class SetBarbershipLogoCommandHandler(
    IBarbershipSettingsRepository settings,
    IUnitOfWork uow) : ICommandHandler<SetBarbershipLogoCommand>
{
    public async Task<Unit> Handle(SetBarbershipLogoCommand cmd, CancellationToken ct)
    {
        var s = await settings.GetByTenantAsync(cmd.TenantId, ct);
        if (s is null)
        {
            s = DomainBarbershipSettings.CreateDefault(cmd.TenantId);
            settings.Add(s);
        }

        s.SetLogo(cmd.LogoUrl);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
