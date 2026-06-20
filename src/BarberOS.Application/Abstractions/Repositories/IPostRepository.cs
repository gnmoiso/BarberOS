using BarberOS.Domain.Posts;

namespace BarberOS.Application.Abstractions.Repositories;

public interface IPostRepository
{
    Task<Post?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Post>> ListByTenantAsync(Guid tenantId, int page, int pageSize, CancellationToken ct = default);
    Task<List<Post>> ListByTenantsAsync(IReadOnlyList<Guid> tenantIds, int page, int pageSize, CancellationToken ct = default);
    Task<PostComment?> FindCommentByIdAsync(Guid id, CancellationToken ct = default);
    void Add(Post post);
    void Remove(Post post);
    void AddReaction(PostReaction reaction);
    void RemoveReaction(PostReaction reaction);
    void AddComment(PostComment comment);
    void AddCommentReaction(CommentReaction reaction);
    void RemoveCommentReaction(CommentReaction reaction);
}
