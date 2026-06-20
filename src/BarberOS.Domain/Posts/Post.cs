using BarberOS.Domain.Common;

namespace BarberOS.Domain.Posts;

public sealed class Post : BaseAuditableEntity
{
    private Post() { }

    private readonly List<PostReaction> _reactions = [];
    private readonly List<PostComment> _comments = [];

    public Guid AuthorId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }

    public IReadOnlyCollection<PostReaction> Reactions => _reactions.AsReadOnly();
    public IReadOnlyCollection<PostComment> Comments => _comments.AsReadOnly();

    public static Post Create(Guid tenantId, Guid authorId, string content, string? imageUrl = null) =>
        new() { TenantId = tenantId, AuthorId = authorId, Content = content.Trim(), ImageUrl = imageUrl };

    /// <summary>
    /// Toggles a reaction. Returns the entity to insert (if any) and the entity to remove (if any) —
    /// the caller must add/remove these explicitly via the repository, since EF's change tracker
    /// can't detect mutations made only through this read-only collection on an already-tracked Post.
    /// </summary>
    public (PostReaction? toAdd, PostReaction? toRemove) AddReaction(Guid userId, ReactionType type)
    {
        var existing = _reactions.FirstOrDefault(r => r.UserId == userId);
        if (existing is not null)
        {
            _reactions.Remove(existing);
            if (existing.Type == type) return (null, existing);
        }
        var created = PostReaction.Create(Id, userId, type);
        _reactions.Add(created);
        return (created, existing);
    }

    /// <summary>Caller must also add the returned comment via the repository — see <see cref="AddReaction"/>.</summary>
    public PostComment AddComment(Guid userId, string text, Guid? parentCommentId = null)
    {
        var comment = PostComment.Create(Id, userId, text, parentCommentId);
        _comments.Add(comment);
        return comment;
    }
}
