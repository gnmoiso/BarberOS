using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Tenants;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class TenantRepository(AppDbContext db) : ITenantRepository
{
    public Task<Tenant?> FindBySlugAsync(string slug, CancellationToken ct) =>
        db.Tenants.FirstOrDefaultAsync(t => t.Slug == slug.ToLowerInvariant(), ct);

    public Task<bool> SlugExistsAsync(string slug, CancellationToken ct) =>
        db.Tenants.AnyAsync(t => t.Slug == slug.ToLowerInvariant(), ct);

    public void Add(Tenant tenant) => db.Tenants.Add(tenant);
}
