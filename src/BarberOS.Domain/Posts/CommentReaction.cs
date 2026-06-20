using BarberOS.Domain.Common;

namespace BarberOS.Domain.Posts;

public sealed class CommentReaction : BaseEntity
{
    private CommentReaction() { }

    public Guid CommentId { get; private set; }
    public Guid UserId { get; private set; }
    public ReactionType Type { get; private set; }

    public static CommentReaction Create(Guid commentId, Guid userId, ReactionType type) =>
        new() { CommentId = commentId, UserId = userId, Type = type };
}
