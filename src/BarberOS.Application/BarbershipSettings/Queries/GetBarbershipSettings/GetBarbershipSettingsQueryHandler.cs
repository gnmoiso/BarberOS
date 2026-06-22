using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.BarbershipSettings.Queries.GetBarbershipSettings;

internal sealed class GetBarbershipSettingsQueryHandler(
    IBarbershipSettingsRepository settings) : ICommandHandler<GetBarbershipSettingsQuery, BarbershipSettingsDto?>
{
    public async Task<BarbershipSettingsDto?> Handle(GetBarbershipSettingsQuery query, CancellationToken ct)
    {
        var s = await settings.GetByTenantAsync(query.TenantId, ct);
        if (s is null) return null;
        return new BarbershipSettingsDto(s.DaysAheadNormalUser, s.BasePriceNoService, s.Currency,
            s.BeardPrice, s.EyebrowPrice, s.WashPrice, s.Address, s.OwnerName, s.ReminderMinutesBeforeAppointment,
            s.MinLeadMinutes, s.LogoUrl);
    }
}
