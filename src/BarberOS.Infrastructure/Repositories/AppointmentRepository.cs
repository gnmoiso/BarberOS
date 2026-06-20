using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Appointments;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class AppointmentRepository(AppDbContext db) : IAppointmentRepository
{
    public Task<Appointment?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Appointments.Include(a => a.AddOns).FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<IReadOnlyList<Appointment>> ListByDateRangeAsync(
        Guid tenantId, DateTimeOffset from, DateTimeOffset to, Guid? barberId, CancellationToken ct)
    {
        var q = db.Appointments.Include(a => a.AddOns)
            .Where(a => a.TenantId == tenantId && a.StartsAt >= from && a.StartsAt < to);
        if (barberId.HasValue) q = q.Where(a => a.BarberId == barberId.Value);
        return await q.OrderBy(a => a.StartsAt).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Appointment>> ListByCustomerAsync(Guid customerId, int page, int size, CancellationToken ct) =>
        await db.Appointments.Include(a => a.AddOns).Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.StartsAt)
            .Skip((page - 1) * size).Take(size)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Appointment>> ListByCustomerIdsAsync(IReadOnlyList<Guid> customerIds, int page, int size, CancellationToken ct) =>
        await db.Appointments.Include(a => a.AddOns).Where(a => customerIds.Contains(a.CustomerId))
            .OrderByDescending(a => a.StartsAt)
            .Skip((page - 1) * size).Take(size)
            .ToListAsync(ct);

    public async Task<bool> HasConflictAsync(Guid tenantId, Guid barberId, DateTimeOffset startsAt, DateTimeOffset endsAt, Guid? excludeId, CancellationToken ct)
    {
        var q = db.Appointments.Where(a =>
            a.TenantId == tenantId &&
            a.BarberId == barberId &&
            a.Status != AppointmentStatus.CancelledByCustomer &&
            a.Status != AppointmentStatus.CancelledByBarber &&
            a.StartsAt < endsAt && a.EndsAt > startsAt);

        if (excludeId.HasValue) q = q.Where(a => a.Id != excludeId.Value);
        return await q.AnyAsync(ct);
    }

    public async Task<int> CountNoShowsAsync(Guid tenantId, Guid customerId, CancellationToken ct) =>
        await db.Appointments.CountAsync(
            a => a.TenantId == tenantId && a.CustomerId == customerId && a.Status == AppointmentStatus.NoShow, ct);

    public Task<int> CountByTenantAsync(Guid tenantId, CancellationToken ct) =>
        db.Appointments.CountAsync(a => a.TenantId == tenantId, ct);

    public void Add(Appointment appointment) => db.Appointments.Add(appointment);

    public void AddAddOn(AppointmentAddOn addOn) => db.Set<AppointmentAddOn>().Add(addOn);
}
