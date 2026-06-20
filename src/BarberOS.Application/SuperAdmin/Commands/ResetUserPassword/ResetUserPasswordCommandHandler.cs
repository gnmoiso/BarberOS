using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.ResetUserPassword;

internal sealed class ResetUserPasswordCommandHandler(
    IUserRepository users,
    IPasswordHasher hasher,
    IUnitOfWork uow) : ICommandHandler<ResetUserPasswordCommand>
{
    public async Task<Unit> Handle(ResetUserPasswordCommand cmd, CancellationToken ct)
    {
        if (cmd.NewPassword.Length < 8)
            throw new ValidationException("password.too_short", "La contraseña debe tener al menos 8 caracteres.");

        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        user.SetPasswordHash(hasher.Hash(cmd.NewPassword));
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
