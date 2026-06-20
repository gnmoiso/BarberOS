using BarberOS.Domain.Common;

namespace BarberOS.Domain.Posts;

public sealed class PostComment : BaseAuditableEntity
{
    private PostComment() { }

    private readonly List<CommentReaction> _reactions = [];

    public Guid PostId { get; private set; }
    public Guid UserId { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public Guid? ParentCommentId { get; private set; }

    public IReadOnlyCollection<CommentReaction> Reactions => _reactions.AsReadOnly();

    public static PostComment Create(Guid postId, Guid userId, string text, Guid? parentId = null) =>
        new() { PostId = postId, UserId = userId, Text = text.Trim(), ParentCommentId = parentId };

    /// <summary>
    /// Toggles a reaction. Returns the entity to insert (if any) and the entity to remove (if
    /// any) — the caller must add/remove these explicitly via the repository, mirroring
    /// <see cref="Post.AddReaction"/>, since EF's change tracker can't detect mutations made
    /// only through this read-only collection on an already-tracked comment.
    /// </summary>
    public (CommentReaction? toAdd, CommentReaction? toRemove) AddReaction(Guid userId, ReactionType type)
    {
        var existing = _reactions.FirstOrDefault(r => r.UserId == userId);
        if (existing is not null)
        {
            _reactions.Remove(existing);
            if (existing.Type == type) return (null, existing);
        }
        var created = CommentReaction.Create(Id, userId, type);
        _reactions.Add(created);
        return (created, existing);
    }
}
