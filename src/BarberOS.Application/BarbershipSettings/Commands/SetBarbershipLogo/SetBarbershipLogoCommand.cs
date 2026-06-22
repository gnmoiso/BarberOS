using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.BarbershipSettings.Commands.SetBarbershipLogo;

public sealed record SetBarbershipLogoCommand(Guid TenantId, string? LogoUrl) : ICommand;
