using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Posts.Queries.ListPosts;

namespace BarberOS.Application.Posts.Queries.GetPostById;

internal sealed class GetPostByIdQueryHandler(
    IPostRepository posts,
    IUserRepository users,
    ITenantRepository tenants,
    IBarbershipSettingsRepository settings) : ICommandHandler<GetPostByIdQuery, PostDto?>
{
    public async Task<PostDto?> Handle(GetPostByIdQuery query, CancellationToken ct)
    {
        var post = await posts.FindByIdAsync(query.PostId, ct);
        if (post is null) return null;

        var tenant = post.TenantId == Guid.Empty ? null : await tenants.FindByIdAsync(post.TenantId, ct);
        var tenantName = post.TenantId == Guid.Empty ? "BarberOS" : tenant?.Name ?? "Barbería";
        var tenantLogo = post.TenantId == Guid.Empty ? null : (await settings.GetByTenantAsync(post.TenantId, ct))?.LogoUrl;

        var authorIds = new[] { post.AuthorId }.Concat(post.Comments.Select(c => c.UserId)).Distinct().ToList();
        var authors = await users.FindManyWithRolesAsync(authorIds, ct);
        var authorMap = authors.ToDictionary(u => u.Id);

        string LabelFor(Guid userId)
        {
            if (!authorMap.TryGetValue(userId, out var user)) return "Usuario";
            var role = user.TenantRoles.FirstOrDefault(r => r.TenantId == post.TenantId)?.Role;
            return user.DisplayLabel(role);
        }

        string? AvatarFor(Guid userId) => authorMap.TryGetValue(userId, out var user) ? user.AvatarUrl : null;

        List<ReactionSummary> Summarize(IEnumerable<(Guid UserId, Domain.Posts.ReactionType Type)> reactions) =>
            reactions.GroupBy(r => r.Type.ToString())
                .Select(g => new ReactionSummary(g.Key, g.Count(), query.ViewerId.HasValue && g.Any(r => r.UserId == query.ViewerId.Value)))
                .OrderByDescending(r => r.Count)
                .ToList();

        return new PostDto(
            post.Id, post.AuthorId, LabelFor(post.AuthorId), AvatarFor(post.AuthorId), post.Content, post.ImageUrl, post.CreatedAt,
            Summarize(post.Reactions.Select(r => (r.UserId, r.Type))),
            post.Comments.Where(c => !c.IsDeleted).Select(c => new CommentDto(
                c.Id, c.UserId, LabelFor(c.UserId), AvatarFor(c.UserId), c.Text, c.CreatedAt, c.ParentCommentId,
                Summarize(c.Reactions.Select(r => (r.UserId, r.Type)))
            )).ToList(),
            post.TenantId,
            tenantName,
            tenantLogo
        );
    }
}
