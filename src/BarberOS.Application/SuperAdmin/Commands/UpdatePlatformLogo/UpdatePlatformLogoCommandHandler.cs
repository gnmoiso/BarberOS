using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Platform;

namespace BarberOS.Application.SuperAdmin.Commands.UpdatePlatformLogo;

internal sealed class UpdatePlatformLogoCommandHandler(
    IPlatformSettingsRepository settings,
    IUnitOfWork uow) : ICommandHandler<UpdatePlatformLogoCommand>
{
    public async Task<Unit> Handle(UpdatePlatformLogoCommand cmd, CancellationToken ct)
    {
        var s = await settings.GetAsync(ct);
        if (s is null)
        {
            s = PlatformSettings.Create();
            settings.Add(s);
        }

        s.SetLogo(cmd.LogoUrl);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
