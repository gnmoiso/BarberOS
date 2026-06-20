using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Platform;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class PlatformSettingsRepository(AppDbContext db) : IPlatformSettingsRepository
{
    public Task<PlatformSettings?> GetAsync(CancellationToken ct) =>
        db.PlatformSettings.FirstOrDefaultAsync(ct);

    public void Add(PlatformSettings settings) => db.PlatformSettings.Add(settings);
}
