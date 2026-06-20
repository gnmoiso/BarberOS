using BarberOS.API.Hubs;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;
using BarberOS.Application.Appointments.Commands.CancelAppointment;
using BarberOS.Application.Appointments.Commands.MarkNoShow;
using BarberOS.Application.Appointments.Commands.RescheduleAppointment;
using BarberOS.Application.Appointments.Queries.GetAvailableSlots;
using BarberOS.Application.Appointments.Queries.GetBookingEligibility;
using BarberOS.Application.Appointments.Queries.ListAppointments;
using BarberOS.Application.Appointments.Commands.UpdateAppointmentStatus;
using BarberOS.Application.Appointments.Queries.ListMyAppointments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/appointments")]
[Authorize]
public sealed class AppointmentsController(ISender sender, IHubContext<AppointmentsHub> hub) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string? TenantId => User.FindFirstValue("tenant_id");

    private Task NotifyTenant(string evt, object payload) =>
        TenantId is { } tenantId
            ? hub.Clients.Group(AppointmentsHub.TenantGroup(tenantId)).SendAsync(evt, payload)
            : Task.CompletedTask;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DateTimeOffset from, [FromQuery] DateTimeOffset to, [FromQuery] Guid? barberId, CancellationToken ct) =>
        Ok(await sender.Send(new ListAppointmentsQuery(from, to, barberId, UserId, RestrictToCaller: !User.IsInRole("Barber")), ct));

    /// <summary>
    /// Customer-facing list — every one of their appointments at this barbershop, not bound to a
    /// single day like the barber's date-range agenda. The customer view never had a real source
    /// for "show my upcoming appointment", so it always queried "today" and showed nothing (23.13.6).
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct) =>
        Ok(await sender.Send(new ListMyAppointmentsQuery(UserId), ct));

    [HttpGet("booking-eligibility")]
    public async Task<IActionResult> BookingEligibility(CancellationToken ct) =>
        Ok(await sender.Send(new GetBookingEligibilityQuery(UserId), ct));

    [HttpGet("available-slots")]
    [AllowAnonymous]
    public async Task<IActionResult> AvailableSlots([FromQuery] Guid barberId, [FromQuery] Guid serviceId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        // Anonymous browsing (e.g. a public booking widget) is never "preferred" — Guid.Empty never
        // matches a UserTenantRole row, so IsPreferredCustomerAsync naturally resolves to false.
        var callerId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;
        return Ok(await sender.Send(new GetAvailableSlotsQuery(barberId, serviceId, date, callerId), ct));
    }

    [HttpPost]
    public async Task<IActionResult> Book([FromBody] BookAppointmentRequest req, CancellationToken ct)
    {
        // Customers booking for themselves never pick a CRM "customer" — the backend resolves
        // (or creates) the record linked to their own account. Only barbers may book on behalf
        // of someone else by passing an explicit CustomerId.
        var isBarber = User.IsInRole("Barber");
        var customerId = isBarber ? req.CustomerId : null;

        var addOns = req.AddOns?.Select(a => new AppointmentAddOnRequest(a.Name, a.Price)).ToList();
        var response = await sender.Send(
            new BookAppointmentCommand(customerId, UserId, req.BarberId, req.ServiceId, req.StartsAt, req.Notes, addOns), ct);
        await NotifyTenant("AppointmentCreated", response);
        return CreatedAtAction(nameof(List), new { from = response.StartsAt.Date, to = response.StartsAt.Date }, response);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelAppointmentRequest req, CancellationToken ct)
    {
        var isBarber = User.IsInRole("Barber");
        // A non-barber can never cancel "as the barbershop" — force the flag regardless of what
        // the client sent, the handler also re-validates this server-side (23.14.2).
        var cancelledByBarber = req.CancelledByBarber && isBarber;
        var response = await sender.Send(
            new CancelAppointmentCommand(id, req.Reason, cancelledByBarber, UserId, isBarber, Guid.Parse(TenantId!)), ct);
        await NotifyTenant("AppointmentCancelled", response);
        return Ok(response);
    }

    [HttpPost("{id:guid}/reschedule")]
    public async Task<IActionResult> Reschedule(Guid id, [FromBody] RescheduleAppointmentRequest req, CancellationToken ct)
    {
        var response = await sender.Send(new RescheduleAppointmentCommand(id, req.BarberId, req.NewStartsAt), ct);
        await NotifyTenant("AppointmentRescheduled", response);
        return Ok(response);
    }

    [HttpPost("{id:guid}/no-show")]
    public async Task<IActionResult> MarkNoShow(Guid id, CancellationToken ct)
    {
        var response = await sender.Send(new MarkNoShowCommand(id), ct);
        await NotifyTenant("AppointmentUpdated", response);
        return Ok(response);
    }

    [HttpPost("{id:guid}/confirm")]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken ct)
    {
        var response = await sender.Send(new UpdateAppointmentStatusCommand(id, AppointmentStatusAction.Confirm), ct);
        await NotifyTenant("AppointmentUpdated", response);
        return Ok(response);
    }

    [HttpPost("{id:guid}/start")]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> Start(Guid id, CancellationToken ct)
    {
        var response = await sender.Send(new UpdateAppointmentStatusCommand(id, AppointmentStatusAction.Start), ct);
        await NotifyTenant("AppointmentUpdated", response);
        return Ok(response);
    }

    [HttpPost("{id:guid}/complete")]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        var response = await sender.Send(new UpdateAppointmentStatusCommand(id, AppointmentStatusAction.Complete), ct);
        await NotifyTenant("AppointmentUpdated", response);
        return Ok(response);
    }
}

public sealed record BookAppointmentRequest(Guid? CustomerId, Guid BarberId, Guid ServiceId, DateTimeOffset StartsAt, string? Notes, IReadOnlyList<AppointmentAddOnDto>? AddOns = null);

public sealed record AppointmentAddOnDto(string Name, decimal Price);
public sealed record CancelAppointmentRequest(string Reason, bool CancelledByBarber = false);
public sealed record RescheduleAppointmentRequest(Guid BarberId, DateTimeOffset NewStartsAt);
