using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Profile.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(
    Guid UserId,
    string FullName,
    string? DisplayName,
    string Email,
    string? Phone) : ICommand;
