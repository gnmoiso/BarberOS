using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Posts.Commands.AddCommentReaction;

internal sealed class AddCommentReactionCommandHandler(
    IPostRepository posts, IUnitOfWork uow) : ICommandHandler<AddCommentReactionCommand>
{
    public async Task<Unit> Handle(AddCommentReactionCommand cmd, CancellationToken ct)
    {
        var comment = await posts.FindCommentByIdAsync(cmd.CommentId, ct)
            ?? throw new NotFoundException("comment.not_found", "Comentario no encontrado.");

        var (toAdd, toRemove) = comment.AddReaction(cmd.UserId, cmd.Type);
        if (toRemove is not null) posts.RemoveCommentReaction(toRemove);
        if (toAdd is not null) posts.AddCommentReaction(toAdd);

        await uow.SaveChangesAsync(ct);
        return default;
    }
}
