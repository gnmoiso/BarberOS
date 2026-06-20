using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Profile.Commands.UpdateProfile;

internal sealed class UpdateProfileCommandHandler(
    IUserRepository users,
    IUnitOfWork uow) : ICommandHandler<UpdateProfileCommand>
{
    public async Task<Unit> Handle(UpdateProfileCommand cmd, CancellationToken ct)
    {
        PhoneValidation.EnsureValidIfProvided(cmd.Phone);

        var user = await users.FindByIdWithRolesAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        var normalizedEmail = cmd.Email.Trim().ToLowerInvariant();
        if (normalizedEmail != user.Email)
        {
            var existing = await users.FindByEmailAsync(normalizedEmail, ct);
            if (existing is not null && existing.Id != user.Id)
                throw new ConflictException("auth.email_taken", "Ya existe una cuenta con ese correo.");
            user.SetEmail(normalizedEmail);
        }

        user.SetFullName(cmd.FullName);
        user.SetDisplayName(cmd.DisplayName);
        user.SetPhone(cmd.Phone);

        await uow.SaveChangesAsync(ct);
        return default;
    }
}
