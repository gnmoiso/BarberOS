using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Posts;
using BarberOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Repositories;

internal sealed class PostRepository(AppDbContext db) : IPostRepository
{
    public Task<Post?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Posts.Include(p => p.Reactions).Include(p => p.Comments).ThenInclude(c => c.Reactions)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    /// <summary>
    /// Includes platform-wide announcements (TenantId == Guid.Empty, created by the SuperAdmin via
    /// "Publicaciones BarberOS") alongside this tenant's own posts — they're meant to reach every barbershop.
    /// </summary>
    public Task<List<Post>> ListByTenantAsync(Guid tenantId, int page, int pageSize, CancellationToken ct) =>
        db.Posts.Include(p => p.Reactions).Include(p => p.Comments).ThenInclude(c => c.Reactions)
            .Where(p => p.TenantId == tenantId || p.TenantId == Guid.Empty)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

    /// <summary>
    /// Consolidated "Novedades" feed for a customer who belongs to several barbershops (23.14.7) —
    /// same global-announcement inclusion rule as <see cref="ListByTenantAsync"/>, but across every
    /// tenant the caller is a member of.
    /// </summary>
    public Task<List<Post>> ListByTenantsAsync(IReadOnlyList<Guid> tenantIds, int page, int pageSize, CancellationToken ct) =>
        db.Posts.Include(p => p.Reactions).Include(p => p.Comments).ThenInclude(c => c.Reactions)
            .Where(p => tenantIds.Contains(p.TenantId) || p.TenantId == Guid.Empty)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

    public Task<PostComment?> FindCommentByIdAsync(Guid id, CancellationToken ct) =>
        db.PostComments.Include(c => c.Reactions).FirstOrDefaultAsync(c => c.Id == id, ct);

    public void Add(Post post) => db.Posts.Add(post);
    public void Remove(Post post) => db.Posts.Remove(post);
    public void AddReaction(PostReaction reaction) => db.Set<PostReaction>().Add(reaction);
    public void RemoveReaction(PostReaction reaction) => db.Set<PostReaction>().Remove(reaction);
    public void AddComment(PostComment comment) => db.Set<PostComment>().Add(comment);
    public void AddCommentReaction(CommentReaction reaction) => db.Set<CommentReaction>().Add(reaction);
    public void RemoveCommentReaction(CommentReaction reaction) => db.Set<CommentReaction>().Remove(reaction);
}
