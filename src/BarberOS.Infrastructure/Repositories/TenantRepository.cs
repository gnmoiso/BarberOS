using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Tenants;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class TenantRepository(AppDbContext db) : ITenantRepository
{
    public Task<Tenant?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Tenants.FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<Tenant?> FindBySlugAsync(string slug, CancellationToken ct) =>
        db.Tenants.FirstOrDefaultAsync(t => t.Slug == slug.ToLowerInvariant(), ct);

    public Task<bool> SlugExistsAsync(string slug, CancellationToken ct) =>
        db.Tenants.AnyAsync(t => t.Slug == slug.ToLowerInvariant(), ct);

    public Task<List<Tenant>> ListByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct) =>
        db.Tenants.Where(t => ids.Contains(t.Id)).ToListAsync(ct);

    public Task<List<Tenant>> ListAllAsync(CancellationToken ct) =>
        db.Tenants.OrderByDescending(t => t.CreatedAt).ToListAsync(ct);

    public void Add(Tenant tenant) => db.Tenants.Add(tenant);
}
