using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Identity.Commands.SwitchTenant;

public sealed record SwitchTenantCommand(Guid UserId, Guid TenantId, string IpAddress) : ICommand<SwitchTenantResponse>;

public sealed record SwitchTenantResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    Guid TenantId,
    string TenantSlug,
    bool LicensePending);
