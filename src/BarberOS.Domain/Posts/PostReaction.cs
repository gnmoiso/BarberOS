using BarberOS.Domain.Common;

namespace BarberOS.Domain.Posts;

public enum ReactionType { Like = 1, Love = 2, Funny = 3 }

public sealed class PostReaction : BaseEntity
{
    private PostReaction() { }

    public Guid PostId { get; private set; }
    public Guid UserId { get; private set; }
    public ReactionType Type { get; private set; }

    public static PostReaction Create(Guid postId, Guid userId, ReactionType type) =>
        new() { PostId = postId, UserId = userId, Type = type };
}
