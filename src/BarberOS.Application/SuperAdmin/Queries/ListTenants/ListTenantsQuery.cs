using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.ListTenants;

public sealed record ListTenantsQuery : IQuery<List<TenantSummaryDto>>;

public sealed record TenantSummaryDto(
    Guid Id,
    string Name,
    string Slug,
    string? OwnerName,
    string? Address,
    string Status,
    string? LicenseCode,
    DateTimeOffset? LicenseExpiresAt,
    bool LicenseActive,
    int BarberCount,
    int CustomerCount,
    DateTimeOffset CreatedAt,
    string? OwnerEmail,
    string? OwnerPhone,
    string? ActiveInvitationCode,
    int AppointmentCount,
    double AverageRatingStars,
    int RatingCount,
    string? LogoUrl);
