using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Identity.Commands.RefreshToken;

public sealed record RefreshTokenCommand(
    string RawToken,
    string IpAddress) : ICommand<RefreshTokenResponse>;

public sealed record RefreshTokenResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt);
