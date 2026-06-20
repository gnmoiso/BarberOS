using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Profile.Commands.UpdateAvatar;

internal sealed class UpdateAvatarCommandHandler(
    IUserRepository users,
    IUnitOfWork uow) : ICommandHandler<UpdateAvatarCommand>
{
    public async Task<Unit> Handle(UpdateAvatarCommand cmd, CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        user.SetAvatarUrl(cmd.AvatarUrl);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
