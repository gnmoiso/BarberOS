using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Tenants.Commands.Register;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/tenants")]
public sealed class TenantsController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Public endpoint — registers a new barbershop and its owner account.
    /// Returns a JWT so the owner is immediately authenticated after sign-up.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterTenantRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await sender.Send(
            new RegisterTenantCommand(
                request.TenantName,
                request.Slug,
                request.OwnerEmail,
                request.OwnerFullName,
                request.OwnerPassword,
                ip), ct);
        return Created($"/api/v1/tenants/{response.TenantId}", response);
    }
}

public sealed record RegisterTenantRequest(
    string TenantName,
    string Slug,
    string OwnerEmail,
    string OwnerFullName,
    string OwnerPassword);
