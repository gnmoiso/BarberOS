using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Posts.Commands.AddReaction;

internal sealed class AddReactionCommandHandler(
    IPostRepository posts, IUnitOfWork uow) : ICommandHandler<AddReactionCommand>
{
    public async Task<Unit> Handle(AddReactionCommand cmd, CancellationToken ct)
    {
        var post = await posts.FindByIdAsync(cmd.PostId, ct)
            ?? throw new NotFoundException("post.not_found", "Post no encontrado.");

        var (toAdd, toRemove) = post.AddReaction(cmd.UserId, cmd.Type);
        if (toRemove is not null) posts.RemoveReaction(toRemove);
        if (toAdd is not null) posts.AddReaction(toAdd);

        await uow.SaveChangesAsync(ct);
        return default;
    }
}
