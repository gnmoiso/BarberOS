using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.SuperAdmin.Queries.GetPlatformSettings;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

/// <summary>
/// Read-only platform branding for pre-auth pages (Home, Login, Register) — no SuperAdmin
/// session exists yet on those screens, so the regular /super-admin/platform-settings endpoint
/// (Authorize Roles=SuperAdmin) is unreachable from there.
/// </summary>
[ApiController]
[Route("api/v1/public/platform-settings")]
public sealed class PublicSettingsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await sender.Send(new GetPlatformSettingsQuery(), ct));
}
