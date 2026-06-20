using BarberOS.API.Hubs;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Ratings.Commands.RateAppointment;
using BarberOS.Application.Ratings.Commands.RateCustomer;
using BarberOS.Application.Ratings.Queries.GetBarbershopRating;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/ratings")]
[Authorize]
public sealed class RatingsController(ISender sender, IHubContext<AppointmentsHub> hub) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    [HttpPost("service")]
    public async Task<IActionResult> RateService([FromBody] RateServiceRequest req, CancellationToken ct)
    {
        await sender.Send(new RateAppointmentCommand(req.AppointmentId, UserId, req.Stars, req.Comment), ct);
        await hub.Clients.Group(AppointmentsHub.TenantGroup(TenantId.ToString())).SendAsync("RatingSubmitted", new { req.AppointmentId }, ct);
        return NoContent();
    }

    [HttpPost("customer")]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> RateCustomer([FromBody] RateCustomerRequest req, CancellationToken ct)
    {
        await sender.Send(new RateCustomerCommand(req.AppointmentId, UserId, req.Stars, req.Notes), ct);
        return NoContent();
    }

    [HttpGet("barbershop")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBarbershopRating([FromQuery] Guid tenantId, CancellationToken ct) =>
        Ok(await sender.Send(new GetBarbershopRatingQuery(tenantId), ct));
}

public sealed record RateServiceRequest(Guid AppointmentId, int Stars, string? Comment);
public sealed record RateCustomerRequest(Guid AppointmentId, int Stars, string? Notes);
