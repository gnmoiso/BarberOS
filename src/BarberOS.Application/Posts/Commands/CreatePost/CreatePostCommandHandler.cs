using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Posts;

namespace BarberOS.Application.Posts.Commands.CreatePost;

internal sealed class CreatePostCommandHandler(
    IPostRepository posts, IUnitOfWork uow) : ICommandHandler<CreatePostCommand, Guid>
{
    public async Task<Guid> Handle(CreatePostCommand cmd, CancellationToken ct)
    {
        var post = Post.Create(cmd.TenantId, cmd.AuthorId, cmd.Content, cmd.ImageUrl);
        posts.Add(post);
        await uow.SaveChangesAsync(ct);
        return post.Id;
    }
}
