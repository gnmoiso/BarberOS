using BarberOS.Domain.Common;

namespace BarberOS.Domain.Staff;

public sealed class WorkSchedule : BaseAuditableEntity
{
    private WorkSchedule() { }

    public Guid BarberId { get; private set; }
    public DayOfWeek Weekday { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public bool IsActive { get; private set; }

    public static WorkSchedule Create(Guid tenantId, Guid barberId, DayOfWeek weekday, TimeOnly start, TimeOnly end)
    {
        if (end <= start) throw new ArgumentException("EndTime must be after StartTime.");

        return new WorkSchedule
        {
            TenantId = tenantId,
            BarberId = barberId,
            Weekday = weekday,
            StartTime = start,
            EndTime = end,
            IsActive = true,
        };
    }

    public void Update(TimeOnly start, TimeOnly end)
    {
        StartTime = start;
        EndTime = end;
    }

    public void SetActive(bool active) => IsActive = active;
}
