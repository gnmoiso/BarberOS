using BarberOS.Domain.Platform;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IPlatformSettingsRepository
{
    Task<PlatformSettings?> GetAsync(CancellationToken ct = default);
    void Add(PlatformSettings settings);
}
