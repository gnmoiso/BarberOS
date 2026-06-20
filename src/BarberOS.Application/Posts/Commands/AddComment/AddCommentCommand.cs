using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Posts.Commands.AddComment;

public sealed record AddCommentCommand(Guid PostId, Guid UserId, string Text, Guid? ParentCommentId) : ICommand<Guid>;
