using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.GetPlatformSettings;

public sealed record GetPlatformSettingsQuery : ICommand<PlatformSettingsDto?>;

public sealed record PlatformSettingsDto(
    string? ContactPhone,
    string? ContactEmail,
    string? ContactWhatsApp,
    string? ContactMessage,
    string? LogoUrl);
