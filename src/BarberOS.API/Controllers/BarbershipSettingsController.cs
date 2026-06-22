using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.BarbershipSettings.Commands.UpdateBarbershipSettings;
using BarberOS.Application.BarbershipSettings.Commands.SetBarbershipLogo;
using BarberOS.Application.BarbershipSettings.Queries.GetBarbershipSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/barbership-settings")]
[Authorize]
public sealed class BarbershipSettingsController(ISender sender) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    // 23.14.4 — customers need read access to see the real extras prices (Barba/Cejas/Lavado)
    // configured by their barbershop while booking; the GET was wrongly Barber-only, so every
    // customer silently got a 403 and rendered "No disponible". Only mutation stays Barber-only.
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await sender.Send(new GetBarbershipSettingsQuery(TenantId), ct));

    [HttpPut]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> Update([FromBody] UpdateSettingsRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdateBarbershipSettingsCommand(TenantId,
            req.DaysAheadNormalUser, req.BasePriceNoService, req.Currency,
            req.BeardPrice, req.EyebrowPrice, req.WashPrice, req.Address, req.OwnerName,
            req.ReminderMinutesBeforeAppointment, req.MinLeadMinutes), ct);
        return NoContent();
    }

    [HttpPut("logo")]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> SetLogo([FromBody] SetLogoRequest req, CancellationToken ct)
    {
        await sender.Send(new SetBarbershipLogoCommand(TenantId, req.LogoUrl), ct);
        return NoContent();
    }
}

public sealed record SetLogoRequest(string? LogoUrl);

public sealed record UpdateSettingsRequest(
    int DaysAheadNormalUser,
    decimal BasePriceNoService,
    string Currency,
    decimal? BeardPrice,
    decimal? EyebrowPrice,
    decimal? WashPrice,
    string? Address,
    string? OwnerName,
    int? ReminderMinutesBeforeAppointment,
    int? MinLeadMinutes);
