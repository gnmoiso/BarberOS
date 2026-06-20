using BarberOS.Domain.Barbershop;

namespace BarberOS.Application.Abstractions.Repositories;

public interface ITestimonialRepository
{
    Task<Testimonial?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<Testimonial?> FindByTenantAsync(Guid tenantId, CancellationToken ct = default);
    Task<List<Testimonial>> ListApprovedForHomeAsync(CancellationToken ct = default);
    Task<List<Testimonial>> ListApprovedForLoginAsync(CancellationToken ct = default);
    Task<List<Testimonial>> ListAllAsync(CancellationToken ct = default);
    void Add(Testimonial testimonial);
}
