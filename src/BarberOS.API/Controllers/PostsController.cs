using BarberOS.API.Hubs;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Posts.Commands.AddComment;
using BarberOS.Application.Posts.Commands.AddCommentReaction;
using BarberOS.Application.Posts.Commands.AddReaction;
using BarberOS.Application.Posts.Commands.CreatePost;
using BarberOS.Application.Posts.Commands.DeletePost;
using BarberOS.Application.Posts.Queries.GetPostById;
using BarberOS.Application.Posts.Queries.ListPosts;
using BarberOS.Application.Identity.Queries.MyTenants;
using BarberOS.Domain.Posts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/posts")]
[Authorize]
public sealed class PostsController(ISender sender, IHubContext<AppointmentsHub> hub) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    // Posts/comments/reactions are scoped to one barbershop's feed, so a tenant-group broadcast
    // is enough — global "Publicaciones BarberOS" posts reach everyone via the "all" group instead
    // (see SuperAdminController.CreateGlobalPost), which every connection already joined.
    // Carries which post changed and why, so the frontend can patch just that post (Facebook-style
    // incremental update) instead of re-fetching and re-rendering the whole feed on every reaction.
    private Task NotifyPostsChanged(string reason, Guid? postId = null) =>
        hub.Clients.Group(AppointmentsHub.TenantGroup(TenantId.ToString()))
            .SendAsync("PostsChanged", new { reason, postId });

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        // 23.14.7 — a customer who belongs to several barbershops sees "Novedades" consolidated
        // across all of them (plus global BarberOS posts); barbers only ever see their own feed.
        IReadOnlyList<Guid>? tenantIds = null;
        if (User.IsInRole("Customer"))
        {
            var myTenants = await sender.Send(new MyTenantsQuery(UserId), ct);
            tenantIds = myTenants.Select(t => t.TenantId).ToList();
        }

        return Ok(await sender.Send(new ListPostsQuery(TenantId, UserId, page, pageSize, tenantIds), ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var post = await sender.Send(new GetPostByIdQuery(id, UserId), ct);
        return post is null ? NotFound() : Ok(post);
    }

    [HttpPost]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> Create([FromBody] CreatePostRequest req, CancellationToken ct)
    {
        var id = await sender.Send(new CreatePostCommand(TenantId, UserId, req.Content, req.ImageUrl), ct);
        await NotifyPostsChanged("created", id);
        return Ok(new { id });
    }

    [HttpPost("{id:guid}/reactions")]
    public async Task<IActionResult> React(Guid id, [FromBody] ReactRequest req, CancellationToken ct)
    {
        await sender.Send(new AddReactionCommand(id, UserId, req.Type), ct);
        await NotifyPostsChanged("reaction", id);
        return NoContent();
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> Comment(Guid id, [FromBody] CommentRequest req, CancellationToken ct)
    {
        var commentId = await sender.Send(new AddCommentCommand(id, UserId, req.Text, req.ParentCommentId), ct);
        await NotifyPostsChanged("comment", id);
        return Ok(new { id = commentId });
    }

    [HttpPost("comments/{commentId:guid}/reactions")]
    public async Task<IActionResult> ReactToComment(Guid commentId, [FromBody] ReactRequest req, CancellationToken ct)
    {
        var postId = await sender.Send(new AddCommentReactionCommand(commentId, UserId, req.Type), ct);
        await NotifyPostsChanged("comment", postId);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Barber")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeletePostCommand(id, UserId), ct);
        await NotifyPostsChanged("deleted", id);
        return NoContent();
    }
}

public sealed record CreatePostRequest(string Content, string? ImageUrl);
public sealed record ReactRequest(ReactionType Type);
public sealed record CommentRequest(string Text, Guid? ParentCommentId);
