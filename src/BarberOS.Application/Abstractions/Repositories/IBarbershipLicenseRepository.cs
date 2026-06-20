using BarberOS.Domain.Licensing;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IBarbershipLicenseRepository
{
    Task<BarbershipLicense?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<BarbershipLicense?> FindByCodeAsync(string code, CancellationToken ct = default);
    Task<List<BarbershipLicense>> ListAllAsync(CancellationToken ct = default);
    void Add(BarbershipLicense license);
}
