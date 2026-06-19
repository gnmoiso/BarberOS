using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Staff;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class BarberRepository(AppDbContext db) : IBarberRepository
{
    public Task<Barber?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Barbers.FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task<IReadOnlyList<Barber>> ListAsync(Guid tenantId, CancellationToken ct) =>
        await db.Barbers.Where(b => b.TenantId == tenantId && b.IsActive)
            .OrderBy(b => b.DisplayName)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<WorkSchedule>> GetScheduleAsync(Guid barberId, CancellationToken ct) =>
        await db.WorkSchedules.Where(w => w.BarberId == barberId)
            .OrderBy(w => w.Weekday)
            .ToListAsync(ct);

    public void Add(Barber barber) => db.Barbers.Add(barber);
    public void AddSchedule(WorkSchedule schedule) => db.WorkSchedules.Add(schedule);
    public void RemoveSchedule(WorkSchedule schedule) => db.WorkSchedules.Remove(schedule);
}
