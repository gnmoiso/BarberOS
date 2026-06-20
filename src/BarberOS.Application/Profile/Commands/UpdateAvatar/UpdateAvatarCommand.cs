using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Profile.Commands.UpdateAvatar;

public sealed record UpdateAvatarCommand(Guid UserId, string AvatarUrl) : ICommand;
