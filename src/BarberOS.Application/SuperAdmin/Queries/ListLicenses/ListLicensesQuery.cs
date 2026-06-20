using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.ListLicenses;

public sealed record ListLicensesQuery : ICommand<List<LicenseDto>>;

public sealed record LicenseDto(
    Guid Id,
    string Code,
    Guid? TenantId,
    DateTimeOffset ExpiresAt,
    bool IsAssigned,
    bool IsExpired,
    string? Notes);
