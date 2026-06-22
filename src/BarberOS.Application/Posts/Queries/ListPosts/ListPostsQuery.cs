using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Posts.Queries.ListPosts;

/// <param name="TenantId">The caller's current active tenant — used to resolve each author's role label
/// when a post belongs to a tenant the caller has no direct membership context for (e.g. global posts).</param>
/// <param name="TenantIds">Every tenant the caller belongs to (23.14.7) — defaults to just [TenantId]
/// for single-barbershop accounts and barbers, who only ever see their own feed.</param>
public sealed record ListPostsQuery(
    Guid TenantId,
    Guid? ViewerId = null,
    int Page = 1,
    int PageSize = 20,
    IReadOnlyList<Guid>? TenantIds = null) : ICommand<List<PostDto>>;

public sealed record PostDto(
    Guid Id,
    Guid AuthorId,
    string AuthorName,
    string? AuthorAvatarUrl,
    string Content,
    string? ImageUrl,
    DateTimeOffset CreatedAt,
    List<ReactionSummary> Reactions,
    List<CommentDto> Comments,
    Guid TenantId,
    string TenantName,
    string? TenantLogoUrl);

public sealed record ReactionSummary(string Type, int Count, bool ViewerReacted);

public sealed record CommentDto(
    Guid Id,
    Guid UserId,
    string AuthorName,
    string? AuthorAvatarUrl,
    string Text,
    DateTimeOffset CreatedAt,
    Guid? ParentCommentId,
    List<ReactionSummary> Reactions);
