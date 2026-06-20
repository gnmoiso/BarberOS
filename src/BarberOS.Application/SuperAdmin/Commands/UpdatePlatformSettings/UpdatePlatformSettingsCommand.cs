using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.UpdatePlatformSettings;

public sealed record UpdatePlatformSettingsCommand(
    string? ContactPhone,
    string? ContactEmail,
    string? ContactWhatsApp,
    string? ContactMessage) : ICommand;
