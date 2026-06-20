using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Barbershop;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class TestimonialRepository(AppDbContext db) : ITestimonialRepository
{
    public Task<Testimonial?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Testimonials.FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<Testimonial?> FindByTenantAsync(Guid tenantId, CancellationToken ct) =>
        db.Testimonials.FirstOrDefaultAsync(t => t.TenantId == tenantId, ct);

    public Task<List<Testimonial>> ListApprovedForHomeAsync(CancellationToken ct) =>
        db.Testimonials.Where(t => t.ShowOnHome).ToListAsync(ct);

    public Task<List<Testimonial>> ListApprovedForLoginAsync(CancellationToken ct) =>
        db.Testimonials.Where(t => t.ShowOnLogin).ToListAsync(ct);

    public Task<List<Testimonial>> ListAllAsync(CancellationToken ct) =>
        db.Testimonials.OrderByDescending(t => t.CreatedAt).ToListAsync(ct);

    public void Add(Testimonial testimonial) => db.Testimonials.Add(testimonial);
}
