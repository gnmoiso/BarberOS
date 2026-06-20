using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Auth.Commands.ActivateLicense;
using BarberOS.Application.Auth.Commands.JoinBarbershop;
using BarberOS.Application.Auth.Commands.RegisterBarber;
using BarberOS.Application.Auth.Commands.RegisterCustomer;
using BarberOS.Application.Identity.Commands.Login;
using BarberOS.Application.Identity.Commands.RefreshToken;
using BarberOS.Application.Identity.Commands.SwitchTenant;
using BarberOS.Application.Identity.Queries.MyTenants;
using BarberOS.Application.Profile.Commands.ChangePassword;
using BarberOS.Application.Profile.Commands.UpdateAvatar;
using BarberOS.Application.Profile.Commands.UpdateProfile;
using BarberOS.Application.Profile.Queries.GetMyProfile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
        var response = await sender.Send(new RefreshTokenCommand(request.RefreshToken, ip), ct);
        return Ok(response);
    }

    [HttpPost("register/barber")]
    public async Task<IActionResult> RegisterBarber([FromBody] RegisterBarberRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await sender.Send(
            new RegisterBarberCommand(request.Email, request.FullName,
                request.Password, request.BarbershopName, request.Phone, ip), ct);
        return Ok(response);
    }

    [Authorize]
    [HttpPost("activate-license")]
    public async Task<IActionResult> ActivateLicense([FromBody] ActivateLicenseRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await sender.Send(new ActivateLicenseCommand(userId, request.LicenseCode), ct);
        return Ok(response);
    }

    [HttpPost("register/customer")]
    public async Task<IActionResult> RegisterCustomer([FromBody] RegisterCustomerRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await sender.Send(
            new RegisterCustomerCommand(request.Email, request.FullName, request.Password, request.Phone, ip), ct);
        return Ok(response);
    }

    [Authorize]
    [HttpPost("join")]
    public async Task<IActionResult> JoinBarbershop([FromBody] JoinBarbershopRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await sender.Send(new JoinBarbershopCommand(userId, request.InvitationCode), ct);
        return Ok(response);
    }

    [Authorize]
    [HttpGet("my-tenants")]
    public async Task<IActionResult> MyTenants(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await sender.Send(new MyTenantsQuery(userId), ct));
    }

    [Authorize]
    [HttpPost("switch-tenant")]
    public async Task<IActionResult> SwitchTenant([FromBody] SwitchTenantRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await sender.Send(new SwitchTenantCommand(userId, request.TenantId, ip), ct);
        return Ok(response);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await sender.Send(new GetMyProfileQuery(userId), ct));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await sender.Send(new UpdateProfileCommand(userId, request.FullName, request.DisplayName, request.Email, request.Phone), ct);
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await sender.Send(new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword), ct);
        return NoContent();
    }

    [Authorize]
    [HttpPut("profile/avatar")]
    public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await sender.Send(new UpdateAvatarCommand(userId, request.AvatarUrl), ct);
        return NoContent();
    }
}

public sealed record LoginRequest(string Email, string Password, Guid? TenantId);
public sealed record RefreshRequest(string RefreshToken);
public sealed record RegisterBarberRequest(string Email, string FullName,
    string Password, string BarbershopName, string? Phone);
public sealed record RegisterCustomerRequest(string Email, string FullName, string Password, string? Phone);
public sealed record JoinBarbershopRequest(string InvitationCode);
public sealed record ActivateLicenseRequest(string LicenseCode);
public sealed record UpdateProfileRequest(string FullName, string? DisplayName, string Email, string? Phone);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record UpdateAvatarRequest(string AvatarUrl);
public sealed record SwitchTenantRequest(Guid TenantId);
