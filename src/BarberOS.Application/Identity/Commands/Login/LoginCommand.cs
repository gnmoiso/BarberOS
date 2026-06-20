using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Identity.Commands.Login;

public sealed record LoginCommand(
    string Email,
    string Password,
    Guid? TenantId,
    string IpAddress) : ICommand<LoginResponse>;

public sealed record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    Guid? TenantId,
    string? TenantSlug,
    bool LicensePending);
