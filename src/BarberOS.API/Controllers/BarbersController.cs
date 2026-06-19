using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Staff.Commands.CreateBarber;
using BarberOS.Application.Staff.Commands.SetSchedule;
using BarberOS.Application.Staff.Commands.UpdateBarber;
using BarberOS.Application.Staff.Queries.ListBarbers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/barbers")]
[Authorize]
public sealed class BarbersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await sender.Send(new ListBarbersQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBarberRequest req, CancellationToken ct)
    {
        var response = await sender.Send(
            new CreateBarberCommand(req.DisplayName, req.Phone, req.UserId), ct);
        return CreatedAtAction(nameof(List), new { }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBarberRequest req, CancellationToken ct)
    {
        var response = await sender.Send(
            new UpdateBarberCommand(id, req.DisplayName, req.Phone, req.PhotoUrl, req.IsActive), ct);
        return Ok(response);
    }

    [HttpPut("{id:guid}/schedule")]
    public async Task<IActionResult> SetSchedule(Guid id, [FromBody] SetScheduleRequest req, CancellationToken ct)
    {
        await sender.Send(new SetScheduleCommand(id, req.Slots), ct);
        return NoContent();
    }
}

public sealed record CreateBarberRequest(string DisplayName, string? Phone, Guid? UserId);
public sealed record UpdateBarberRequest(string DisplayName, string? Phone, string? PhotoUrl, bool IsActive);
public sealed record SetScheduleRequest(IReadOnlyList<ScheduleSlotDto> Slots);
