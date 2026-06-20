using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Posts.Commands.AddComment;

internal sealed class AddCommentCommandHandler(
    IPostRepository posts, IUnitOfWork uow) : ICommandHandler<AddCommentCommand, Guid>
{
    public async Task<Guid> Handle(AddCommentCommand cmd, CancellationToken ct)
    {
        var post = await posts.FindByIdAsync(cmd.PostId, ct)
            ?? throw new NotFoundException("post.not_found", "Post no encontrado.");

        var comment = post.AddComment(cmd.UserId, cmd.Text, cmd.ParentCommentId);
        comment.TenantId = post.TenantId;
        posts.AddComment(comment);
        await uow.SaveChangesAsync(ct);
        return comment.Id;
    }
}
