using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Auth.Commands.ActivateLicense;

public sealed record ActivateLicenseCommand(Guid UserId, string LicenseCode) : ICommand<ActivateLicenseResponse>;

public sealed record ActivateLicenseResponse(Guid TenantId, DateTimeOffset LicenseExpiresAt);
