using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BarberOS.API.Hubs;

/// <summary>
/// Pushes appointment/rating events to everyone connected from the same barbershop, so the
/// barber's agenda and dashboard update live without a manual refresh (23.11.7/23.11.8).
/// Clients join a group keyed by their JWT's tenant_id claim — never broadcast across tenants.
/// </summary>
[Authorize]
public sealed class AppointmentsHub : Hub
{
    public const string AllGroup = "all";

    public override async Task OnConnectedAsync()
    {
        var tenantId = Context.User?.FindFirstValue("tenant_id");
        if (!string.IsNullOrEmpty(tenantId))
            await Groups.AddToGroupAsync(Context.ConnectionId, TenantGroup(tenantId));

        // Every connected client also joins "all" so platform-wide announcements (Publicaciones
        // BarberOS, 23.12.3) reach every barbershop and customer regardless of tenant.
        await Groups.AddToGroupAsync(Context.ConnectionId, AllGroup);

        await base.OnConnectedAsync();
    }

    public static string TenantGroup(string tenantId) => $"tenant:{tenantId}";
}
