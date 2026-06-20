using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Profile.Queries.GetMyProfile;

internal sealed class GetMyProfileQueryHandler(
    IUserRepository users) : ICommandHandler<GetMyProfileQuery, MyProfileDto>
{
    public async Task<MyProfileDto> Handle(GetMyProfileQuery query, CancellationToken ct)
    {
        var user = await users.FindByIdWithRolesAsync(query.UserId, ct)
            ?? throw new NotFoundException("user.not_found", "Usuario no encontrado.");

        var role = user.IsSuperAdmin
            ? "SuperAdmin"
            : user.TenantRoles.FirstOrDefault()?.Role.ToString() ?? "Customer";

        return new MyProfileDto(
            user.Id, user.Email, user.FullName, user.DisplayName,
            user.Phone, user.AvatarUrl, role, user.IsSuperAdmin);
    }
}
