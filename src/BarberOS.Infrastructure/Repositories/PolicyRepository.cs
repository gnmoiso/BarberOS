using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Policies;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class PolicyRepository(AppDbContext db) : IPolicyRepository
{
    public Task<PenaltyPolicy?> GetPenaltyPolicyAsync(Guid tenantId, CancellationToken ct) =>
        db.PenaltyPolicies.FirstOrDefaultAsync(p => p.TenantId == tenantId, ct);

    public Task<NoShowPolicy?> GetNoShowPolicyAsync(Guid tenantId, CancellationToken ct) =>
        db.NoShowPolicies.FirstOrDefaultAsync(p => p.TenantId == tenantId, ct);

    public void AddPenaltyPolicy(PenaltyPolicy policy) => db.PenaltyPolicies.Add(policy);
    public void AddNoShowPolicy(NoShowPolicy policy) => db.NoShowPolicies.Add(policy);
}
