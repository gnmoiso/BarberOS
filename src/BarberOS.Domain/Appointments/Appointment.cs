using BarberOS.Domain.Common;

namespace BarberOS.Domain.Appointments;

public sealed class Appointment : BaseAuditableEntity
{
    private readonly List<AppointmentAddOn> addOns = [];

    private Appointment() { }

    public IReadOnlyList<AppointmentAddOn> AddOns => addOns;

    public Guid CustomerId { get; private set; }
    public Guid BarberId { get; private set; }
    public Guid ServiceId { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public string? CancellationReason { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public decimal ServicePrice { get; private set; }
    public int ServiceDurationMinutes { get; private set; }
    public string ServiceName { get; private set; } = string.Empty;
    public decimal? PenaltyAmount { get; private set; }
    public string? PenaltyReason { get; private set; }
    public string? ReminderStatus { get; private set; }

    public static Appointment Book(
        Guid tenantId,
        Guid customerId,
        Guid barberId,
        Guid serviceId,
        string serviceName,
        decimal servicePrice,
        int serviceDurationMinutes,
        DateTimeOffset startsAt,
        string? notes = null)
    {
        return new Appointment
        {
            TenantId = tenantId,
            CustomerId = customerId,
            BarberId = barberId,
            ServiceId = serviceId,
            ServiceName = serviceName,
            ServicePrice = servicePrice,
            ServiceDurationMinutes = serviceDurationMinutes,
            StartsAt = startsAt,
            EndsAt = startsAt.AddMinutes(serviceDurationMinutes),
            Status = AppointmentStatus.Pending,
            Notes = notes?.Trim(),
        };
    }

    /// <summary>
    /// Returns the new add-on so the caller explicitly adds it via the repository (db.Set&lt;AppointmentAddOn&gt;().Add(...)) —
    /// mutating only the in-memory navigation collection on an already-tracked parent causes EF to misdetect it as
    /// Modified instead of Added, throwing DbUpdateConcurrencyException on save.
    /// </summary>
    public AppointmentAddOn AddAddOn(string name, decimal price)
    {
        var addOn = AppointmentAddOn.Create(TenantId, Id, name, price);
        addOns.Add(addOn);
        return addOn;
    }

    public void Confirm() => TransitionTo(AppointmentStatus.Confirmed);

    public void Start() => TransitionTo(AppointmentStatus.InProgress);

    public void Complete() => TransitionTo(AppointmentStatus.Completed);

    public void CancelByCustomer(string reason, decimal? penaltyAmount = null, string? penaltyReason = null)
    {
        TransitionTo(AppointmentStatus.CancelledByCustomer);
        CancellationReason = reason.Trim();
        CancelledAt = DateTimeOffset.UtcNow;
        if (penaltyAmount.HasValue)
        {
            PenaltyAmount = penaltyAmount;
            PenaltyReason = penaltyReason;
        }
    }

    public void CancelByBarber(string reason)
    {
        TransitionTo(AppointmentStatus.CancelledByBarber);
        CancellationReason = reason.Trim();
        CancelledAt = DateTimeOffset.UtcNow;
    }

    public void MarkNoShow(decimal? penaltyAmount = null, string? penaltyReason = null)
    {
        TransitionTo(AppointmentStatus.NoShow);
        if (penaltyAmount.HasValue)
        {
            PenaltyAmount = penaltyAmount;
            PenaltyReason = penaltyReason;
        }
    }

    public void Reschedule(Guid barberId, DateTimeOffset newStartsAt)
    {
        if (Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
            throw new InvalidOperationException("Only pending or confirmed appointments can be rescheduled.");

        BarberId = barberId;
        StartsAt = newStartsAt;
        EndsAt = newStartsAt.AddMinutes(ServiceDurationMinutes);
    }

    private void TransitionTo(AppointmentStatus target)
    {
        var valid = (Status, target) switch
        {
            (AppointmentStatus.Pending, AppointmentStatus.Confirmed) => true,
            (AppointmentStatus.Pending, AppointmentStatus.CancelledByCustomer) => true,
            (AppointmentStatus.Pending, AppointmentStatus.CancelledByBarber) => true,
            (AppointmentStatus.Pending, AppointmentStatus.NoShow) => true,
            (AppointmentStatus.Confirmed, AppointmentStatus.InProgress) => true,
            (AppointmentStatus.Confirmed, AppointmentStatus.CancelledByCustomer) => true,
            (AppointmentStatus.Confirmed, AppointmentStatus.CancelledByBarber) => true,
            (AppointmentStatus.Confirmed, AppointmentStatus.NoShow) => true,
            (AppointmentStatus.InProgress, AppointmentStatus.Completed) => true,
            _ => false
        };

        if (!valid) throw new InvalidOperationException($"Cannot transition appointment from {Status} to {target}.");
        Status = target;
    }
}
