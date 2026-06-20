using BarberOS.Domain.Identity;
using BarberOS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/clients")]
[Authorize(Roles = "Barber")]
public sealed class ClientsController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var tenantId = TenantId;
        var clients = await db.Set<UserTenantRole>()
            .Where(r => r.TenantId == tenantId && r.Role == Role.Customer)
            .Join(db.Users, r => r.UserId, u => u.Id, (r, u) => new
            {
                r.Id,
                r.UserId,
                u.FullName,
                u.Email,
                u.Phone,
                r.IsPreferred,
                r.PenaltyPercentage,
                JoinedAt = (DateTimeOffset?)null,
            })
            .ToListAsync(ct);
        return Ok(clients);
    }

    [HttpPatch("{userId:guid}/preferred")]
    public async Task<IActionResult> SetPreferred(Guid userId, [FromBody] SetPreferredRequest req, CancellationToken ct)
    {
        var tenantId = TenantId;
        var role = await db.Set<UserTenantRole>()
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.Role == Role.Customer, ct);
        if (role is null) return NotFound();
        role.SetPreferred(req.IsPreferred);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{userId:guid}/penalty")]
    public async Task<IActionResult> SetPenalty(Guid userId, [FromBody] SetPenaltyRequest req, CancellationToken ct)
    {
        var tenantId = TenantId;
        var role = await db.Set<UserTenantRole>()
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.Role == Role.Customer, ct);
        if (role is null) return NotFound();
        role.SetPenalty(req.PenaltyPercentage);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Remove(Guid userId, CancellationToken ct)
    {
        var tenantId = TenantId;
        var role = await db.Set<UserTenantRole>()
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.Role == Role.Customer, ct);
        if (role is null) return NotFound();
        db.Set<UserTenantRole>().Remove(role);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public sealed record SetPreferredRequest(bool IsPreferred);
public sealed record SetPenaltyRequest(int PenaltyPercentage);
