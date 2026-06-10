using BarberOS.Domain.Tenants;

namespace BarberOS.Application.Abstractions.Repositories;

public interface ITenantRepository
{
    Task<Tenant?> FindBySlugAsync(string slug, CancellationToken ct = default);
    Task<bool> SlugExistsAsync(string slug, CancellationToken ct = default);
    void Add(Tenant tenant);
}
