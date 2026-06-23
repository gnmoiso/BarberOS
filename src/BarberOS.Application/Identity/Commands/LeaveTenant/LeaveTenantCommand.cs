using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Identity.Commands.LeaveTenant;

/// <summary>Lets a customer leave one of the barbershops they've joined, from the
/// "Código de barbería" screen. Re-issues tokens because the JWT carries tenant_id as a
/// claim — if the tenant being left is the caller's currently active one, the new token
/// switches to another remaining tenant (or to no tenant at all, same state a brand-new
/// customer is in before ever joining one).</summary>
public sealed record LeaveTenantCommand(Guid UserId, Guid TenantId, Guid? CurrentActiveTenantId, string IpAddress) : ICommand<LeaveTenantResponse>;

public sealed record LeaveTenantResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    Guid? TenantId,
    string? TenantSlug);
