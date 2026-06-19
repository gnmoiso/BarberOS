using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Catalog;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class ServiceRepository(AppDbContext db) : IServiceRepository
{
    public Task<Service?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Services.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IReadOnlyList<Service>> ListAsync(Guid tenantId, CancellationToken ct) =>
        await db.Services.Where(s => s.TenantId == tenantId)
            .OrderBy(s => s.SortOrder).ThenBy(s => s.Name)
            .ToListAsync(ct);

    public void Add(Service service) => db.Services.Add(service);
    public void Remove(Service service) => db.Services.Remove(service);
}
