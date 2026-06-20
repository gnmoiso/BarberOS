using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Platform;

namespace BarberOS.Application.SuperAdmin.Commands.UpdatePlatformSettings;

internal sealed class UpdatePlatformSettingsCommandHandler(
    IPlatformSettingsRepository settings,
    IUnitOfWork uow) : ICommandHandler<UpdatePlatformSettingsCommand>
{
    public async Task<Unit> Handle(UpdatePlatformSettingsCommand cmd, CancellationToken ct)
    {
        var s = await settings.GetAsync(ct);
        if (s is null)
        {
            var created = PlatformSettings.Create();
            created.Update(cmd.ContactPhone, cmd.ContactEmail, cmd.ContactWhatsApp, cmd.ContactMessage);
            settings.Add(created);
        }
        else
        {
            s.Update(cmd.ContactPhone, cmd.ContactEmail, cmd.ContactWhatsApp, cmd.ContactMessage);
        }

        await uow.SaveChangesAsync(ct);
        return default;
    }
}
