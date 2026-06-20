using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Barbershop;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class InvitationCodeRepository(AppDbContext db) : IInvitationCodeRepository
{
    public Task<InvitationCode?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.InvitationCodes.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<InvitationCode?> FindByCodeAsync(string code, CancellationToken ct) =>
        db.InvitationCodes.FirstOrDefaultAsync(c => c.Code == code.ToUpperInvariant() && c.IsActive, ct);

    public Task<List<InvitationCode>> ListByTenantAsync(Guid tenantId, CancellationToken ct) =>
        db.InvitationCodes.Where(c => c.TenantId == tenantId).ToListAsync(ct);

    public void Add(InvitationCode code) => db.InvitationCodes.Add(code);
}
