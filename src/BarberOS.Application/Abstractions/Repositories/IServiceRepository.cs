using BarberOS.Domain.Catalog;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IServiceRepository
{
    Task<Service?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Service>> ListAsync(Guid tenantId, CancellationToken ct = default);
    void Add(Service service);
    void Remove(Service service);
}
