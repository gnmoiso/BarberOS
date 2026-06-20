using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.SuperAdmin.Queries.ListLicenses;

internal sealed class ListLicensesQueryHandler(
    IBarbershipLicenseRepository licenses,
    IDateTimeProvider clock) : ICommandHandler<ListLicensesQuery, List<LicenseDto>>
{
    public async Task<List<LicenseDto>> Handle(ListLicensesQuery query, CancellationToken ct)
    {
        var all = await licenses.ListAllAsync(ct);
        return all.Select(l => new LicenseDto(
            l.Id, l.Code, l.TenantId, l.ExpiresAt,
            l.IsAssigned, l.IsExpired(clock.UtcNow), l.Notes)).ToList();
    }
}
