using BarberOS.Domain.Policies;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IPolicyRepository
{
    Task<PenaltyPolicy?> GetPenaltyPolicyAsync(Guid tenantId, CancellationToken ct = default);
    Task<NoShowPolicy?> GetNoShowPolicyAsync(Guid tenantId, CancellationToken ct = default);
    void AddPenaltyPolicy(PenaltyPolicy policy);
    void AddNoShowPolicy(NoShowPolicy policy);
}
