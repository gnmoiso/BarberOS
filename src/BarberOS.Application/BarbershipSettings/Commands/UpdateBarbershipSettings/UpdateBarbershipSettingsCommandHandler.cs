using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using DomainBarbershipSettings = BarberOS.Domain.Barbershop.BarbershipSettings;

namespace BarberOS.Application.BarbershipSettings.Commands.UpdateBarbershipSettings;

internal sealed class UpdateBarbershipSettingsCommandHandler(
    IBarbershipSettingsRepository settings,
    IUnitOfWork uow) : ICommandHandler<UpdateBarbershipSettingsCommand>
{
    public async Task<Unit> Handle(UpdateBarbershipSettingsCommand cmd, CancellationToken ct)
    {
        var s = await settings.GetByTenantAsync(cmd.TenantId, ct);
        if (s is null)
        {
            s = DomainBarbershipSettings.CreateDefault(cmd.TenantId);
            settings.Add(s);
        }

        s.UpdateGeneral(cmd.DaysAheadNormalUser, cmd.BasePriceNoService, cmd.Currency,
            cmd.BeardPrice, cmd.EyebrowPrice, cmd.WashPrice, cmd.ReminderMinutesBeforeAppointment);
        s.UpdateProfile(cmd.Address, cmd.OwnerName);

        await uow.SaveChangesAsync(ct);
        return default;
    }
}
