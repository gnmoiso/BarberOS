using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.SuperAdmin.Queries.GetPlatformSettings;

internal sealed class GetPlatformSettingsQueryHandler(
    IPlatformSettingsRepository settings) : ICommandHandler<GetPlatformSettingsQuery, PlatformSettingsDto?>
{
    public async Task<PlatformSettingsDto?> Handle(GetPlatformSettingsQuery query, CancellationToken ct)
    {
        var s = await settings.GetAsync(ct);
        if (s is null) return null;
        return new PlatformSettingsDto(s.ContactPhone, s.ContactEmail, s.ContactWhatsApp, s.ContactMessage, s.LogoUrl);
    }
}
