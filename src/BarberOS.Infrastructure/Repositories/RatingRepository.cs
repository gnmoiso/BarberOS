using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Ratings;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class RatingRepository(AppDbContext db) : IRatingRepository
{
    public Task<ServiceRating?> FindServiceRatingByAppointmentAsync(Guid appointmentId, CancellationToken ct) =>
        db.ServiceRatings.FirstOrDefaultAsync(r => r.AppointmentId == appointmentId, ct);

    public Task<CustomerRating?> FindCustomerRatingByAppointmentAsync(Guid appointmentId, CancellationToken ct) =>
        db.CustomerRatings.FirstOrDefaultAsync(r => r.AppointmentId == appointmentId, ct);

    public async Task<double> GetBarbershopAverageStarsAsync(Guid tenantId, CancellationToken ct)
    {
        var ratings = await db.ServiceRatings.Where(r => r.TenantId == tenantId).Select(r => (double)r.Stars).ToListAsync(ct);
        return ratings.Count == 0 ? 0 : ratings.Average();
    }

    public Task<int> GetBarbershopRatingCountAsync(Guid tenantId, CancellationToken ct) =>
        db.ServiceRatings.CountAsync(r => r.TenantId == tenantId, ct);

    public void Add(ServiceRating rating) => db.ServiceRatings.Add(rating);
    public void AddCustomerRating(CustomerRating rating) => db.CustomerRatings.Add(rating);
}
