using BarberOS.Domain.Staff;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IBarberRepository
{
    Task<Barber?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<Barber?> FindByUserIdAsync(Guid tenantId, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<Barber>> ListAsync(Guid tenantId, CancellationToken ct = default);
    Task<List<string?>> ListAllPhonesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<WorkSchedule>> GetScheduleAsync(Guid barberId, CancellationToken ct = default);
    void Add(Barber barber);
    void Remove(Barber barber);
    void AddSchedule(WorkSchedule schedule);
    void RemoveSchedule(WorkSchedule schedule);
}
