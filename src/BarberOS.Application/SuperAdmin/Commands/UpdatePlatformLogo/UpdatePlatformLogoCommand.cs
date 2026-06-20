using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.UpdatePlatformLogo;

public sealed record UpdatePlatformLogoCommand(string LogoUrl) : ICommand;
