using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Profile.Commands.ChangePassword;

internal sealed class ChangePasswordCommandHandler(
    IUserRepository users,
    IPasswordHasher hasher,
    IUnitOfWork uow) : ICommandHandler<ChangePasswordCommand>
{
    public async Task<Unit> Handle(ChangePasswordCommand cmd, CancellationToken ct)
    {
        if (cmd.NewPassword.Length < 8)
            throw new ValidationException("password.too_short", "La nueva contraseña debe tener al menos 8 caracteres.");

        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        if (!hasher.Verify(cmd.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedException("auth.invalid_credentials", "Contraseña actual incorrecta.");

        user.SetPasswordHash(hasher.Hash(cmd.NewPassword));
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
