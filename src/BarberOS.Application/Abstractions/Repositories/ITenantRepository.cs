using BarberOS.Domain.Tenants;

namespace BarberOS.Application.Abstractions.Repositories;

public interface ITenantRepository
{
    Task<Tenant?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<Tenant?> FindBySlugAsync(string slug, CancellationToken ct = default);
    Task<bool> SlugExistsAsync(string slug, CancellationToken ct = default);
    Task<List<Tenant>> ListByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default);
    Task<List<Tenant>> ListAllAsync(CancellationToken ct = default);
    void Add(Tenant tenant);
}
