using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.InvitationCodes.Commands.DeactivateInvitationCode;

internal sealed class DeactivateInvitationCodeCommandHandler(
    IInvitationCodeRepository codes,
    IUnitOfWork uow) : ICommandHandler<DeactivateInvitationCodeCommand>
{
    public async Task<Unit> Handle(DeactivateInvitationCodeCommand cmd, CancellationToken ct)
    {
        var code = await codes.FindByIdAsync(cmd.CodeId, ct)
            ?? throw new NotFoundException("code.not_found", "Código no encontrado.");

        if (code.TenantId != cmd.TenantId)
            throw new ForbiddenException("code.forbidden", "No puedes gestionar ese código.");

        code.Deactivate();
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
