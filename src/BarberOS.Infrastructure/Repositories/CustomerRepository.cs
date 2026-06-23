using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Customers;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class CustomerRepository(AppDbContext db) : ICustomerRepository
{
    public Task<Customer?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<Customer?> FindByPhoneAsync(Guid tenantId, string phone, CancellationToken ct) =>
        db.Customers.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == phone, ct);

    public Task<Customer?> FindByUserIdAsync(Guid tenantId, Guid userId, CancellationToken ct) =>
        db.Customers.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.UserId == userId, ct);

    public async Task<IReadOnlyList<Customer>> SearchAsync(Guid tenantId, string? query, int page, int size, CancellationToken ct)
    {
        var q = db.Customers.Where(c => c.TenantId == tenantId);
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(c => c.FullName.Contains(query) || c.Phone.Contains(query));
        return await q.OrderBy(c => c.FullName)
            .Skip((page - 1) * size).Take(size)
            .ToListAsync(ct);
    }

    public async Task<int> CountAsync(Guid tenantId, string? query, CancellationToken ct)
    {
        var q = db.Customers.Where(c => c.TenantId == tenantId);
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(c => c.FullName.Contains(query) || c.Phone.Contains(query));
        return await q.CountAsync(ct);
    }

    public Task<List<Customer>> ListByUserIdAcrossTenantsAsync(Guid userId, CancellationToken ct) =>
        db.Customers.Where(c => c.UserId == userId).ToListAsync(ct);

    public Task<List<string>> ListAllPhonesAsync(CancellationToken ct) =>
        db.Customers.Select(c => c.Phone).ToListAsync(ct);

    public Task<List<Customer>> ListAllAsync(CancellationToken ct) =>
        db.Customers.OrderByDescending(c => c.CreatedAt).ToListAsync(ct);

    public void Add(Customer customer) => db.Customers.Add(customer);
}
