using BarberOS.Domain.Appointments;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IAppointmentRepository
{
    Task<Appointment?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Appointment>> ListByDateRangeAsync(Guid tenantId, DateTimeOffset from, DateTimeOffset to, Guid? barberId = null, CancellationToken ct = default);
    Task<IReadOnlyList<Appointment>> ListByCustomerAsync(Guid customerId, int page, int size, CancellationToken ct = default);
    Task<bool> HasConflictAsync(Guid tenantId, Guid barberId, DateTimeOffset startsAt, DateTimeOffset endsAt, Guid? excludeId = null, CancellationToken ct = default);
    Task<int> CountNoShowsAsync(Guid tenantId, Guid customerId, CancellationToken ct = default);
    void Add(Appointment appointment);
}
