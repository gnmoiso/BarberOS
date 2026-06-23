using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Auth.Commands.JoinBarbershop;

internal sealed class JoinBarbershopByTokenCommandHandler(
    IUserRepository users,
    IInvitationCodeRepository codes,
    ITenantRepository tenants,
    ICustomerRepository customers,
    IJwtService jwt,
    IUnitOfWork uow) : ICommandHandler<JoinBarbershopByTokenCommand, JoinBarbershopResponse>
{
    public async Task<JoinBarbershopResponse> Handle(JoinBarbershopByTokenCommand cmd, CancellationToken ct)
    {
        var code = await codes.FindByIdAsync(cmd.CodeId, ct);
        if (code is null || !code.IsActive)
            throw new NotFoundException("code.not_found", "Código de invitación inválido o inactivo.");

        return await JoinBarbershopCore.ExecuteAsync(code, cmd.UserId, users, customers, tenants, jwt, uow, ct);
    }
}
