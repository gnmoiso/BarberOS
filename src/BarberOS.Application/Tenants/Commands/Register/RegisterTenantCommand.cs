using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Tenants.Commands.Register;

public sealed record RegisterTenantCommand(
    string TenantName,
    string Slug,
    string OwnerEmail,
    string OwnerFullName,
    string OwnerPassword,
    string IpAddress) : ICommand<RegisterTenantResponse>;

public sealed record RegisterTenantResponse(
    Guid TenantId,
    string Slug,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt);
