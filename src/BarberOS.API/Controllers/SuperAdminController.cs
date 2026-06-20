using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.SuperAdmin.Commands.ExtendLicense;
using BarberOS.Application.SuperAdmin.Commands.GenerateLicense;
using BarberOS.Application.SuperAdmin.Commands.ResetUserPassword;
using BarberOS.Application.SuperAdmin.Commands.SetTestimonialVisibility;
using BarberOS.Application.SuperAdmin.Commands.UpdatePlatformLogo;
using BarberOS.Application.SuperAdmin.Commands.UpdatePlatformSettings;
using BarberOS.Application.SuperAdmin.Queries.GetPlatformSettings;
using BarberOS.Application.SuperAdmin.Queries.ListLicenses;
using BarberOS.Application.SuperAdmin.Queries.ListTenantMembers;
using BarberOS.Application.SuperAdmin.Queries.ListTenants;
using BarberOS.Application.SuperAdmin.Queries.ListTestimonials;
using BarberOS.Application.SuperAdmin.Queries.AuditPhones;
using BarberOS.Application.Posts.Queries.ListPosts;
using BarberOS.Application.Posts.Commands.AddReaction;
using BarberOS.Application.Posts.Commands.AddComment;
using BarberOS.Application.Posts.Commands.CreatePost;
using BarberOS.Application.Posts.Commands.DeletePost;
using BarberOS.API.Hubs;
using BarberOS.Domain.Posts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/super-admin")]
[Authorize(Roles = "SuperAdmin")]
public sealed class SuperAdminController(ISender sender, IHubContext<AppointmentsHub> hub) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Licenses
    [HttpGet("licenses")]
    public async Task<IActionResult> ListLicenses(CancellationToken ct) =>
        Ok(await sender.Send(new ListLicensesQuery(), ct));

    [HttpPost("licenses")]
    public async Task<IActionResult> GenerateLicense([FromBody] GenerateLicenseRequest req, CancellationToken ct)
    {
        var result = await sender.Send(new GenerateLicenseCommand(req.ExpiresAt, req.Notes), ct);
        return Ok(result);
    }

    [HttpPut("licenses/{id:guid}/extend")]
    public async Task<IActionResult> ExtendLicense(Guid id, [FromBody] ExtendLicenseRequest req, CancellationToken ct)
    {
        await sender.Send(new ExtendLicenseCommand(id, req.NewExpiresAt), ct);
        return NoContent();
    }

    // Tenants (barbershops)
    [HttpGet("tenants")]
    public async Task<IActionResult> ListTenants(CancellationToken ct) =>
        Ok(await sender.Send(new ListTenantsQuery(), ct));

    [HttpGet("tenants/{tenantId:guid}/members")]
    public async Task<IActionResult> ListTenantMembers(Guid tenantId, CancellationToken ct) =>
        Ok(await sender.Send(new ListTenantMembersQuery(tenantId), ct));

    // 23.17.5 — diagnostic over existing phone data registered before the 10-digit rule existed.
    [HttpGet("phone-audit")]
    public async Task<IActionResult> AuditPhones(CancellationToken ct) =>
        Ok(await sender.Send(new AuditPhonesQuery(), ct));

    // Novedades — SuperAdmin can browse any barbershop's posts and react/comment as "Dueño {nick}"
    [HttpGet("tenants/{tenantId:guid}/posts")]
    public async Task<IActionResult> ListTenantPosts(Guid tenantId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await sender.Send(new ListPostsQuery(tenantId, UserId, page, pageSize), ct));

    // Publicaciones BarberOS — platform-wide announcements shown to every barbershop and customer
    [HttpPost("posts/global")]
    public async Task<IActionResult> CreateGlobalPost([FromBody] CreateGlobalPostRequest req, CancellationToken ct)
    {
        var id = await sender.Send(new CreatePostCommand(Guid.Empty, UserId, req.Content, req.ImageUrl), ct);
        await hub.Clients.Group(AppointmentsHub.AllGroup).SendAsync("PostsChanged", cancellationToken: ct);
        return Ok(new { id });
    }

    [HttpPost("posts/{postId:guid}/reactions")]
    public async Task<IActionResult> ReactToPost(Guid postId, [FromBody] SuperAdminReactRequest req, CancellationToken ct)
    {
        await sender.Send(new AddReactionCommand(postId, UserId, req.Type), ct);
        return NoContent();
    }

    [HttpPost("posts/{postId:guid}/comments")]
    public async Task<IActionResult> CommentOnPost(Guid postId, [FromBody] SuperAdminCommentRequest req, CancellationToken ct)
    {
        var commentId = await sender.Send(new AddCommentCommand(postId, UserId, req.Text, req.ParentCommentId), ct);
        return Ok(new { id = commentId });
    }

    [HttpDelete("posts/{postId:guid}")]
    public async Task<IActionResult> DeletePost(Guid postId, CancellationToken ct)
    {
        await sender.Send(new DeletePostCommand(postId, RequesterUserId: null), ct);
        return NoContent();
    }

    // Users — password reset by platform owner
    [HttpPost("users/{userId:guid}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(Guid userId, [FromBody] ResetUserPasswordRequest req, CancellationToken ct)
    {
        await sender.Send(new ResetUserPasswordCommand(userId, req.NewPassword), ct);
        return NoContent();
    }

    // Platform settings — readable by anyone (shown on Home, Login, and the post-registration
    // "Contact BarberOS" screen before a barber even has a tenant/role to be authorized against).
    [HttpGet("platform-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlatformSettings(CancellationToken ct) =>
        Ok(await sender.Send(new GetPlatformSettingsQuery(), ct));

    [HttpPut("platform-settings")]
    public async Task<IActionResult> UpdatePlatformSettings([FromBody] UpdatePlatformSettingsRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdatePlatformSettingsCommand(req.ContactPhone, req.ContactEmail,
            req.ContactWhatsApp, req.ContactMessage), ct);
        return NoContent();
    }

    // Logo oficial BarberOS — siempre por archivo subido, nunca por URL externa (23.11.10)
    [HttpPut("platform-settings/logo")]
    public async Task<IActionResult> UpdateLogo([FromBody] UpdateLogoRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdatePlatformLogoCommand(req.LogoUrl), ct);
        return NoContent();
    }

    // Testimonials
    [HttpGet("testimonials")]
    public async Task<IActionResult> ListTestimonials(CancellationToken ct) =>
        Ok(await sender.Send(new ListTestimonialsQuery(), ct));

    [HttpPut("testimonials/{id:guid}/visibility")]
    public async Task<IActionResult> SetVisibility(Guid id, [FromBody] SetVisibilityRequest req, CancellationToken ct)
    {
        await sender.Send(new SetTestimonialVisibilityCommand(id, req.ShowOnHome, req.ShowOnLogin), ct);
        return NoContent();
    }
}

public sealed record GenerateLicenseRequest(DateTimeOffset ExpiresAt, string? Notes);
public sealed record ExtendLicenseRequest(DateTimeOffset NewExpiresAt);
public sealed record UpdatePlatformSettingsRequest(string? ContactPhone, string? ContactEmail,
    string? ContactWhatsApp, string? ContactMessage);
public sealed record SetVisibilityRequest(bool ShowOnHome, bool ShowOnLogin);
public sealed record SuperAdminReactRequest(ReactionType Type);
public sealed record SuperAdminCommentRequest(string Text, Guid? ParentCommentId);
public sealed record ResetUserPasswordRequest(string NewPassword);
public sealed record CreateGlobalPostRequest(string Content, string? ImageUrl);
public sealed record UpdateLogoRequest(string LogoUrl);
