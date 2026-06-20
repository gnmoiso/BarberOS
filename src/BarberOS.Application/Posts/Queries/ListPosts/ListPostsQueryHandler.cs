using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Posts.Queries.ListPosts;

internal sealed class ListPostsQueryHandler(
    IPostRepository posts,
    IUserRepository users,
    ITenantRepository tenants) : ICommandHandler<ListPostsQuery, List<PostDto>>
{
    public async Task<List<PostDto>> Handle(ListPostsQuery query, CancellationToken ct)
    {
        var tenantIds = query.TenantIds ?? [query.TenantId];
        var all = tenantIds.Count > 1
            ? await posts.ListByTenantsAsync(tenantIds, query.Page, query.PageSize, ct)
            : await posts.ListByTenantAsync(query.TenantId, query.Page, query.PageSize, ct);

        var tenantRecords = await tenants.ListByIdsAsync(tenantIds, ct);
        var tenantNameMap = tenantRecords.ToDictionary(t => t.Id, t => t.Name);
        string TenantNameFor(Guid tenantId) =>
            tenantId == Guid.Empty ? "BarberOS" : tenantNameMap.GetValueOrDefault(tenantId, "Barbería");

        var authorIds = all.Select(p => p.AuthorId)
            .Concat(all.SelectMany(p => p.Comments).Select(c => c.UserId))
            .Distinct()
            .ToList();
        var authors = await users.FindManyWithRolesAsync(authorIds, ct);
        var authorMap = authors.ToDictionary(u => u.Id);

        string LabelFor(Guid userId, Guid postTenantId)
        {
            if (!authorMap.TryGetValue(userId, out var user)) return "Usuario";
            var role = user.TenantRoles.FirstOrDefault(r => r.TenantId == postTenantId)?.Role;
            return user.DisplayLabel(role);
        }

        string? AvatarFor(Guid userId) => authorMap.TryGetValue(userId, out var user) ? user.AvatarUrl : null;

        List<ReactionSummary> Summarize(IEnumerable<(Guid UserId, Domain.Posts.ReactionType Type)> reactions) =>
            reactions.GroupBy(r => r.Type.ToString())
                .Select(g => new ReactionSummary(g.Key, g.Count(), query.ViewerId.HasValue && g.Any(r => r.UserId == query.ViewerId.Value)))
                .OrderByDescending(r => r.Count)
                .ToList();

        return all.Select(p => new PostDto(
            p.Id, p.AuthorId, LabelFor(p.AuthorId, p.TenantId), AvatarFor(p.AuthorId), p.Content, p.ImageUrl, p.CreatedAt,
            Summarize(p.Reactions.Select(r => (r.UserId, r.Type))),
            p.Comments.Where(c => !c.IsDeleted).Select(c => new CommentDto(
                c.Id, c.UserId, LabelFor(c.UserId, p.TenantId), AvatarFor(c.UserId), c.Text, c.CreatedAt, c.ParentCommentId,
                Summarize(c.Reactions.Select(r => (r.UserId, r.Type)))
            )).ToList(),
            p.TenantId,
            TenantNameFor(p.TenantId)
        )).ToList();
    }
}
