using BarberOS.Domain.Common;

namespace BarberOS.Domain.Staff;

public sealed class WorkSchedule : BaseAuditableEntity
{
    private WorkSchedule() { }

    public Guid BarberId { get; private set; }
    public DayOfWeek Weekday { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public TimeOnly? BreakStart { get; private set; }
    public TimeOnly? BreakEnd { get; private set; }
    public bool IsActive { get; private set; }

    public static WorkSchedule Create(
        Guid tenantId, Guid barberId, DayOfWeek weekday, TimeOnly start, TimeOnly end,
        TimeOnly? breakStart = null, TimeOnly? breakEnd = null)
    {
        if (end <= start) throw new ArgumentException("EndTime must be after StartTime.");
        ValidateBreak(start, end, breakStart, breakEnd);

        return new WorkSchedule
        {
            TenantId = tenantId,
            BarberId = barberId,
            Weekday = weekday,
            StartTime = start,
            EndTime = end,
            BreakStart = breakStart,
            BreakEnd = breakEnd,
            IsActive = true,
        };
    }

    public void Update(TimeOnly start, TimeOnly end, TimeOnly? breakStart = null, TimeOnly? breakEnd = null)
    {
        if (end <= start) throw new ArgumentException("EndTime must be after StartTime.");
        ValidateBreak(start, end, breakStart, breakEnd);

        StartTime = start;
        EndTime = end;
        BreakStart = breakStart;
        BreakEnd = breakEnd;
    }

    public void SetActive(bool active) => IsActive = active;

    private static void ValidateBreak(TimeOnly start, TimeOnly end, TimeOnly? breakStart, TimeOnly? breakEnd)
    {
        if (breakStart is null && breakEnd is null) return;
        if (breakStart is null || breakEnd is null)
            throw new ArgumentException("BreakStart and BreakEnd must both be set or both be null.");
        if (breakEnd <= breakStart)
            throw new ArgumentException("BreakEnd must be after BreakStart.");
        if (breakStart < start || breakEnd > end)
            throw new ArgumentException("Break must be within the work day.");
    }
}
