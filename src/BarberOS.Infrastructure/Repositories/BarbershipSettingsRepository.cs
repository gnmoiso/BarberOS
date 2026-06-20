using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Barbershop;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class BarbershipSettingsRepository(AppDbContext db) : IBarbershipSettingsRepository
{
    public Task<BarbershipSettings?> GetByTenantAsync(Guid tenantId, CancellationToken ct) =>
        db.BarbershipSettings.FirstOrDefaultAsync(s => s.TenantId == tenantId, ct);

    public void Add(BarbershipSettings settings) => db.BarbershipSettings.Add(settings);
}
