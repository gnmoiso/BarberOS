using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Catalog.Commands.CreateService;
using BarberOS.Application.Catalog.Commands.DeleteService;
using BarberOS.Application.Catalog.Commands.UpdateService;
using BarberOS.Application.Catalog.Queries.ListServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/services")]
[Authorize]
public sealed class ServicesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await sender.Send(new ListServicesQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceRequest req, CancellationToken ct)
    {
        var response = await sender.Send(
            new CreateServiceCommand(req.Name, req.DurationMinutes, req.Price, req.Description, req.Category), ct);
        return CreatedAtAction(nameof(List), new { }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateServiceRequest req, CancellationToken ct)
    {
        var response = await sender.Send(
            new UpdateServiceCommand(id, req.Name, req.DurationMinutes, req.Price, req.Description, req.Category, req.IsActive), ct);
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeleteServiceCommand(id), ct);
        return NoContent();
    }
}

public sealed record CreateServiceRequest(string Name, int DurationMinutes, decimal Price, string? Description, string? Category);
public sealed record UpdateServiceRequest(string Name, int DurationMinutes, decimal Price, string? Description, string? Category, bool IsActive);
