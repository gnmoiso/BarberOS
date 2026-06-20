using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Staff;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class BarberRepository(AppDbContext db) : IBarberRepository
{
    public Task<Barber?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Barbers.FirstOrDefaultAsync(b => b.Id == id, ct);

    public Task<Barber?> FindByUserIdAsync(Guid tenantId, Guid userId, CancellationToken ct) =>
        db.Barbers.FirstOrDefaultAsync(b => b.TenantId == tenantId && b.UserId == userId, ct);

    /// <summary>
    /// Returns every barber (active and inactive) so the team-management screen can show and reactivate
    /// deactivated staff. Booking flows must filter <c>IsActive</c> client-side — an inactive barber must
    /// never be selectable for a new appointment, but still needs to be visible to the owner to manage.
    /// </summary>
    public async Task<IReadOnlyList<Barber>> ListAsync(Guid tenantId, CancellationToken ct) =>
        await db.Barbers.Where(b => b.TenantId == tenantId)
            .OrderBy(b => b.DisplayName)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<WorkSchedule>> GetScheduleAsync(Guid barberId, CancellationToken ct) =>
        await db.WorkSchedules.Where(w => w.BarberId == barberId)
            .OrderBy(w => w.Weekday)
            .ToListAsync(ct);

    public Task<List<string?>> ListAllPhonesAsync(CancellationToken ct) =>
        db.Barbers.Select(b => b.Phone).ToListAsync(ct);

    public void Add(Barber barber) => db.Barbers.Add(barber);
    public void Remove(Barber barber) => db.Barbers.Remove(barber);
    public void AddSchedule(WorkSchedule schedule) => db.WorkSchedules.Add(schedule);
    public void RemoveSchedule(WorkSchedule schedule) => db.WorkSchedules.Remove(schedule);
}
