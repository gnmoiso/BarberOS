using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Profile.Queries.GetMyProfile;

public sealed record GetMyProfileQuery(Guid UserId) : ICommand<MyProfileDto>;

public sealed record MyProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? DisplayName,
    string? Phone,
    string? AvatarUrl,
    string Role,
    bool IsSuperAdmin);
