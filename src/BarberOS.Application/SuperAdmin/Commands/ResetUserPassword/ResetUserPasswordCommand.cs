using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.ResetUserPassword;

public sealed record ResetUserPasswordCommand(Guid UserId, string NewPassword) : ICommand;
