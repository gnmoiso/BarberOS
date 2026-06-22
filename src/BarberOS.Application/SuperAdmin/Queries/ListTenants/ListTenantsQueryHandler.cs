using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.SuperAdmin.Queries.ListTenants;

internal sealed class ListTenantsQueryHandler(
    ITenantRepository tenants,
    IUserRepository users,
    IInvitationCodeRepository invitationCodes,
    IAppointmentRepository appointments,
    IRatingRepository ratings,
    IBarbershipSettingsRepository settings,
    IDateTimeProvider clock) : IQueryHandler<ListTenantsQuery, List<TenantSummaryDto>>
{
    public async Task<List<TenantSummaryDto>> Handle(ListTenantsQuery query, CancellationToken ct)
    {
        var all = await tenants.ListAllAsync(ct);
        var result = new List<TenantSummaryDto>(all.Count);

        foreach (var tenant in all)
        {
            var counts = await users.CountTenantMembersByRoleAsync(tenant.Id, ct);

            // 23.15.5 — the owner is the earliest Barber member of the tenant; there's no
            // dedicated OwnerUserId link in the schema, but RegisterBarberCommandHandler always
            // creates exactly one Barber for the account that registered the barbershop.
            var members = await users.ListTenantMembersAsync(tenant.Id, ct);
            var owner = members.Where(m => m.Role == Role.Barber).OrderBy(m => m.User.CreatedAt).FirstOrDefault();

            var codes = await invitationCodes.ListByTenantAsync(tenant.Id, ct);
            var activeCode = codes.FirstOrDefault(c => c.IsActive)?.Code;

            var appointmentCount = await appointments.CountByTenantAsync(tenant.Id, ct);
            var avgRating = await ratings.GetBarbershopAverageStarsAsync(tenant.Id, ct);
            var ratingCount = await ratings.GetBarbershopRatingCountAsync(tenant.Id, ct);
            var tenantSettings = await settings.GetByTenantAsync(tenant.Id, ct);

            result.Add(new TenantSummaryDto(
                tenant.Id,
                tenant.Name,
                tenant.Slug,
                tenant.OwnerName,
                tenant.Address,
                tenant.Status.ToString(),
                tenant.LicenseCode,
                tenant.LicenseExpiresAt,
                tenant.IsLicenseActive(clock.UtcNow),
                counts.GetValueOrDefault(Role.Barber),
                counts.GetValueOrDefault(Role.Customer),
                tenant.CreatedAt,
                owner.User?.Email,
                owner.User?.Phone,
                activeCode,
                appointmentCount,
                avgRating,
                ratingCount,
                tenantSettings?.LogoUrl));
        }

        return result;
    }
}
