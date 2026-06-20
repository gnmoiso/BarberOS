using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Auth.Commands.RegisterBarber;

public sealed record RegisterBarberCommand(
    string Email,
    string FullName,
    string Password,
    string BarbershopName,
    string? Phone,
    string IpAddress) : ICommand<RegisterBarberResponse>;

public sealed record RegisterBarberResponse(
    Guid UserId,
    Guid TenantId,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    string FullName,
    string Role,
    bool LicensePending);
