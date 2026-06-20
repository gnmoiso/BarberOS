using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Licensing;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class BarbershipLicenseRepository(AppDbContext db) : IBarbershipLicenseRepository
{
    public Task<BarbershipLicense?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.BarbershipLicenses.FirstOrDefaultAsync(l => l.Id == id, ct);

    public Task<BarbershipLicense?> FindByCodeAsync(string code, CancellationToken ct) =>
        db.BarbershipLicenses.FirstOrDefaultAsync(l => l.Code == code.ToUpperInvariant(), ct);

    public Task<List<BarbershipLicense>> ListAllAsync(CancellationToken ct) =>
        db.BarbershipLicenses.OrderByDescending(l => l.CreatedAt).ToListAsync(ct);

    public void Add(BarbershipLicense license) => db.BarbershipLicenses.Add(license);
}
