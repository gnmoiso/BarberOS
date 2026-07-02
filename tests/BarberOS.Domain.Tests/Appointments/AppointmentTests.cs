using BarberOS.Domain.Appointments;
using Xunit;

namespace BarberOS.Domain.Tests.Appointments;

public class AppointmentTests
{
    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly Guid CustomerId = Guid.NewGuid();
    private static readonly Guid BarberId = Guid.NewGuid();
    private static readonly Guid ServiceId = Guid.NewGuid();
    private static readonly DateTimeOffset Future = DateTimeOffset.UtcNow.AddDays(1);

    private static Appointment Make(DateTimeOffset? startsAt = null) =>
        Appointment.Book(TenantId, CustomerId, BarberId, ServiceId,
            "Corte", 25_000m, 30, startsAt ?? Future);

    // ── Book ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Book_SetsInitialStatusToPending()
    {
        var a = Make();
        Assert.Equal(AppointmentStatus.Pending, a.Status);
    }

    [Fact]
    public void Book_ComputesEndsAtFromDuration()
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);
        var a = Make(start);
        Assert.Equal(start.AddMinutes(30), a.EndsAt);
    }

    [Fact]
    public void Book_TrimsNotes()
    {
        var a = Appointment.Book(TenantId, CustomerId, BarberId, ServiceId,
            "Corte", 25_000m, 30, Future, "  nota con espacios  ");
        Assert.Equal("nota con espacios", a.Notes);
    }

    // ── State machine ─────────────────────────────────────────────────────────

    [Fact]
    public void Confirm_TransitionsPendingToConfirmed()
    {
        var a = Make();
        a.Confirm();
        Assert.Equal(AppointmentStatus.Confirmed, a.Status);
    }

    [Fact]
    public void Start_TransitionsConfirmedToInProgress()
    {
        var a = Make();
        a.Confirm();
        a.Start();
        Assert.Equal(AppointmentStatus.InProgress, a.Status);
    }

    [Fact]
    public void Complete_TransitionsInProgressToCompleted()
    {
        var a = Make();
        a.Confirm();
        a.Start();
        a.Complete();
        Assert.Equal(AppointmentStatus.Completed, a.Status);
    }

    [Fact]
    public void InvalidTransition_ThrowsInvalidOperationException()
    {
        var a = Make();
        // Pending → InProgress is not a valid step
        Assert.Throws<InvalidOperationException>(() => a.Start());
    }

    [Fact]
    public void CancelByCustomer_StoresCancellationMetadata()
    {
        var a = Make();
        a.CancelByCustomer("Cambio de planes");
        Assert.Equal(AppointmentStatus.CancelledByCustomer, a.Status);
        Assert.Equal("Cambio de planes", a.CancellationReason);
        Assert.NotNull(a.CancelledAt);
    }

    [Fact]
    public void CancelByCustomer_WithPenalty_StoresPenaltyData()
    {
        var a = Make();
        a.CancelByCustomer("Cancelación tardía", 5_000m, "Dentro de ventana de 24h");
        Assert.Equal(5_000m, a.PenaltyAmount);
        Assert.Equal("Dentro de ventana de 24h", a.PenaltyReason);
    }

    [Fact]
    public void CancelByBarber_StoresCancellationReason()
    {
        var a = Make();
        a.CancelByBarber("Emergencia");
        Assert.Equal(AppointmentStatus.CancelledByBarber, a.Status);
        Assert.Equal("Emergencia", a.CancellationReason);
    }

    [Fact]
    public void MarkNoShow_TransitionsFromPending()
    {
        var a = Make();
        a.MarkNoShow();
        Assert.Equal(AppointmentStatus.NoShow, a.Status);
    }

    [Fact]
    public void MarkNoShow_TransitionsFromConfirmed()
    {
        var a = Make();
        a.Confirm();
        a.MarkNoShow();
        Assert.Equal(AppointmentStatus.NoShow, a.Status);
    }

    // ── Reschedule ────────────────────────────────────────────────────────────

    [Fact]
    public void Reschedule_UpdatesTimesAndBarber()
    {
        var a = Make();
        var newStart = Future.AddHours(2);
        var newBarber = Guid.NewGuid();
        a.Reschedule(newBarber, newStart);
        Assert.Equal(newStart, a.StartsAt);
        Assert.Equal(newStart.AddMinutes(30), a.EndsAt);
        Assert.Equal(newBarber, a.BarberId);
    }

    [Fact]
    public void Reschedule_FromConfirmed_Succeeds()
    {
        var a = Make();
        a.Confirm();
        a.Reschedule(BarberId, Future.AddHours(3)); // should not throw
    }

    [Fact]
    public void Reschedule_FromInProgress_ThrowsInvalidOperationException()
    {
        var a = Make();
        a.Confirm();
        a.Start();
        Assert.Throws<InvalidOperationException>(() => a.Reschedule(BarberId, Future));
    }

    // ── CanBeRated ────────────────────────────────────────────────────────────

    [Fact]
    public void CanBeRated_ReturnsFalse_BeforeOneHourAfterStart()
    {
        var start = DateTimeOffset.UtcNow.AddMinutes(30); // starts in the future
        var a = Make(start);
        Assert.False(a.CanBeRated(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void CanBeRated_ReturnsTrue_OneHourAfterStart_WhenPending()
    {
        // The critical rule: barber never confirmed but 1h+ elapsed → customer can still rate.
        var start = DateTimeOffset.UtcNow.AddHours(-2);
        var a = Make(start);
        // Status is still Pending (barber didn't update it)
        Assert.Equal(AppointmentStatus.Pending, a.Status);
        Assert.True(a.CanBeRated(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void CanBeRated_ReturnsTrue_AfterOneHour_WhenConfirmed()
    {
        var start = DateTimeOffset.UtcNow.AddHours(-2);
        var a = Make(start);
        a.Confirm();
        Assert.True(a.CanBeRated(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void CanBeRated_ReturnsFalse_WhenCancelledByCustomer()
    {
        var start = DateTimeOffset.UtcNow.AddHours(-2);
        var a = Make(start);
        a.CancelByCustomer("No puedo");
        Assert.False(a.CanBeRated(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void CanBeRated_ReturnsFalse_WhenCancelledByBarber()
    {
        var start = DateTimeOffset.UtcNow.AddHours(-2);
        var a = Make(start);
        a.CancelByBarber("Cerrado");
        Assert.False(a.CanBeRated(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void CanBeRated_ReturnsFalse_WhenNoShow()
    {
        var start = DateTimeOffset.UtcNow.AddHours(-2);
        var a = Make(start);
        a.MarkNoShow();
        Assert.False(a.CanBeRated(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void CanBeRated_ReturnsTrue_ExactlyOneHourAfterStart()
    {
        var start = DateTimeOffset.UtcNow.AddHours(-1);
        var a = Make(start);
        Assert.True(a.CanBeRated(start.AddHours(1)));
    }

    // ── AddOn ─────────────────────────────────────────────────────────────────

    [Fact]
    public void AddAddOn_AppearsInReadOnlyList()
    {
        var a = Make();
        a.AddAddOn("Barba", 10_000m);
        Assert.Single(a.AddOns);
        Assert.Equal("Barba", a.AddOns[0].Name);
        Assert.Equal(10_000m, a.AddOns[0].Price);
    }

    [Fact]
    public void AddAddOn_MultipleAddOnsAccumulate()
    {
        var a = Make();
        a.AddAddOn("Barba", 10_000m);
        a.AddAddOn("Cejas", 5_000m);
        Assert.Equal(2, a.AddOns.Count);
    }
}
