using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Barbershop;
using BarberOS.Domain.Common;

namespace BarberOS.Application.InvitationCodes.Commands.CreateInvitationCode;

internal sealed class CreateInvitationCodeCommandHandler(
    IInvitationCodeRepository codes,
    IUnitOfWork uow) : ICommandHandler<CreateInvitationCodeCommand, CreateInvitationCodeResponse>
{
    public async Task<CreateInvitationCodeResponse> Handle(CreateInvitationCodeCommand cmd, CancellationToken ct)
    {
        var existing = await codes.FindByCodeAsync(cmd.Code, ct);
        if (existing is not null)
            throw new ConflictException("code.exists", "Ya existe un código con ese valor.");

        var code = InvitationCode.Create(cmd.TenantId, cmd.Code.ToUpperInvariant(), cmd.Label);
        codes.Add(code);
        await uow.SaveChangesAsync(ct);

        return new CreateInvitationCodeResponse(code.Id, code.Code);
    }
}
