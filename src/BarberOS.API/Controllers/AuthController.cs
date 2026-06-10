using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Identity.Commands.Login;
using BarberOS.Application.Identity.Commands.RefreshToken;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await sender.Send(
            new LoginCommand(request.Email, request.Password, request.TenantId, ip), ct);
        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await sender.Send(
            new RefreshTokenCommand(request.RefreshToken, ip), ct);
        return Ok(response);
    }
}

public sealed record LoginRequest(string Email, string Password, Guid TenantId);
public sealed record RefreshRequest(string RefreshToken);
