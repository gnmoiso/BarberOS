using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.InvitationCodes.Commands.CreateInvitationCode;

public sealed record CreateInvitationCodeCommand(
    Guid TenantId,
    string Code,
    string? Label) : ICommand<CreateInvitationCodeResponse>;

public sealed record CreateInvitationCodeResponse(Guid Id, string Code);
