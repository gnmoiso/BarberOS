using BarberOS.Domain.Barbershop;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IInvitationCodeRepository
{
    Task<InvitationCode?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<InvitationCode?> FindByCodeAsync(string code, CancellationToken ct = default);
    Task<List<InvitationCode>> ListByTenantAsync(Guid tenantId, CancellationToken ct = default);
    void Add(InvitationCode code);
}
