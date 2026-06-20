using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Auth.Commands.RegisterCustomer;

public sealed record RegisterCustomerCommand(
    string Email,
    string FullName,
    string Password,
    string? Phone,
    string IpAddress) : ICommand<RegisterCustomerResponse>;

public sealed record RegisterCustomerResponse(
    Guid UserId,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    string FullName,
    string Role);
