using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Profile.Commands.ChangePassword;

public sealed record ChangePasswordCommand(Guid UserId, string CurrentPassword, string NewPassword) : ICommand;
