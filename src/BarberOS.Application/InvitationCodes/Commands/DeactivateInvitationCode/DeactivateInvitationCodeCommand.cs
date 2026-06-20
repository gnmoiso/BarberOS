using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.InvitationCodes.Commands.DeactivateInvitationCode;

public sealed record DeactivateInvitationCodeCommand(Guid CodeId, Guid TenantId) : ICommand;
