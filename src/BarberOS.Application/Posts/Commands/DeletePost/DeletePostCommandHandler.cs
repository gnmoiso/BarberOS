using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Posts.Commands.DeletePost;

internal sealed class DeletePostCommandHandler(
    IPostRepository posts, IUnitOfWork uow) : ICommandHandler<DeletePostCommand>
{
    public async Task<Unit> Handle(DeletePostCommand cmd, CancellationToken ct)
    {
        var post = await posts.FindByIdAsync(cmd.PostId, ct)
            ?? throw new NotFoundException("post.not_found", "Post no encontrado.");

        if (cmd.RequesterUserId.HasValue && post.AuthorId != cmd.RequesterUserId.Value)
            throw new ForbiddenException("post.forbidden", "Solo puedes eliminar tus propias publicaciones.");

        posts.Remove(post);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
