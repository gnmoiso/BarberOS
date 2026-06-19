using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Appointments.Commands.BookAppointment;
using BarberOS.Application.Appointments.Commands.CancelAppointment;
using BarberOS.Application.Appointments.Commands.MarkNoShow;
using BarberOS.Application.Appointments.Commands.RescheduleAppointment;
using BarberOS.Application.Appointments.Queries.GetAvailableSlots;
using BarberOS.Application.Appointments.Queries.ListAppointments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/appointments")]
[Authorize]
public sealed class AppointmentsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DateTimeOffset from, [FromQuery] DateTimeOffset to, [FromQuery] Guid? barberId, CancellationToken ct) =>
        Ok(await sender.Send(new ListAppointmentsQuery(from, to, barberId), ct));

    [HttpGet("available-slots")]
    [AllowAnonymous]
    public async Task<IActionResult> AvailableSlots([FromQuery] Guid barberId, [FromQuery] Guid serviceId, [FromQuery] DateOnly date, CancellationToken ct) =>
        Ok(await sender.Send(new GetAvailableSlotsQuery(barberId, serviceId, date), ct));

    [HttpPost]
    public async Task<IActionResult> Book([FromBody] BookAppointmentRequest req, CancellationToken ct)
    {
        var response = await sender.Send(
            new BookAppointmentCommand(req.CustomerId, req.BarberId, req.ServiceId, req.StartsAt, req.Notes), ct);
        return CreatedAtAction(nameof(List), new { from = response.StartsAt.Date, to = response.StartsAt.Date }, response);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelAppointmentRequest req, CancellationToken ct)
    {
        var response = await sender.Send(new CancelAppointmentCommand(id, req.Reason, req.CancelledByBarber), ct);
        return Ok(response);
    }

    [HttpPost("{id:guid}/reschedule")]
    public async Task<IActionResult> Reschedule(Guid id, [FromBody] RescheduleAppointmentRequest req, CancellationToken ct)
    {
        var response = await sender.Send(new RescheduleAppointmentCommand(id, req.BarberId, req.NewStartsAt), ct);
        return Ok(response);
    }

    [HttpPost("{id:guid}/no-show")]
    public async Task<IActionResult> MarkNoShow(Guid id, CancellationToken ct)
    {
        var response = await sender.Send(new MarkNoShowCommand(id), ct);
        return Ok(response);
    }
}

public sealed record BookAppointmentRequest(Guid CustomerId, Guid BarberId, Guid ServiceId, DateTimeOffset StartsAt, string? Notes);
public sealed record CancelAppointmentRequest(string Reason, bool CancelledByBarber = false);
public sealed record RescheduleAppointmentRequest(Guid BarberId, DateTimeOffset NewStartsAt);
