using DomainBarbershipSettings = BarberOS.Domain.Barbershop.BarbershipSettings;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IBarbershipSettingsRepository
{
    Task<DomainBarbershipSettings?> GetByTenantAsync(Guid tenantId, CancellationToken ct = default);
    void Add(DomainBarbershipSettings settings);
}
