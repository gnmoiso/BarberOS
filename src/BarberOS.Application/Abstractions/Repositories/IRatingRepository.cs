using BarberOS.Domain.Ratings;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IRatingRepository
{
    Task<ServiceRating?> FindServiceRatingByAppointmentAsync(Guid appointmentId, CancellationToken ct = default);
    Task<CustomerRating?> FindCustomerRatingByAppointmentAsync(Guid appointmentId, CancellationToken ct = default);
    Task<double> GetBarbershopAverageStarsAsync(Guid tenantId, CancellationToken ct = default);
    Task<int> GetBarbershopRatingCountAsync(Guid tenantId, CancellationToken ct = default);
    void Add(ServiceRating rating);
    void AddCustomerRating(CustomerRating rating);
}
