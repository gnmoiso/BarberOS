using BarberOS.Domain.Appointments;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IAppointmentRepository
{
    Task<Appointment?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Appointment>> ListByDateRangeAsync(Guid tenantId, DateTimeOffset from, DateTimeOffset to, Guid? barberId = null, CancellationToken ct = default);
    Task<IReadOnlyList<Appointment>> ListByCustomerAsync(Guid customerId, int page, int size, CancellationToken ct = default);

    /// <summary>Every appointment across several CRM Customer records — used for the user-wide
    /// (cross-barbershop) one-active-appointment rule and the consolidated history (23.16.4/23.16.6).</summary>
    Task<IReadOnlyList<Appointment>> ListByCustomerIdsAsync(IReadOnlyList<Guid> customerIds, int page, int size, CancellationToken ct = default);
    Task<bool> HasConflictAsync(Guid tenantId, Guid barberId, DateTimeOffset startsAt, DateTimeOffset endsAt, Guid? excludeId = null, CancellationToken ct = default);
    Task<int> CountNoShowsAsync(Guid tenantId, Guid customerId, CancellationToken ct = default);
    Task<int> CountByTenantAsync(Guid tenantId, CancellationToken ct = default);
    void Add(Appointment appointment);
    void AddAddOn(AppointmentAddOn addOn);
}
