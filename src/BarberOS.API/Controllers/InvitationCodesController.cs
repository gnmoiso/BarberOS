using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.InvitationCodes.Commands.CreateInvitationCode;
using BarberOS.Application.InvitationCodes.Commands.DeactivateInvitationCode;
using BarberOS.Application.InvitationCodes.Queries.ListInvitationCodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/invitation-codes")]
[Authorize(Roles = "Barber")]
public sealed class InvitationCodesController(ISender sender) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await sender.Send(new ListInvitationCodesQuery(TenantId), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCodeRequest req, CancellationToken ct)
    {
        var result = await sender.Send(new CreateInvitationCodeCommand(TenantId, req.Code, req.Label), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeactivateInvitationCodeCommand(id, TenantId), ct);
        return NoContent();
    }
}

public sealed record CreateCodeRequest(string Code, string? Label);
