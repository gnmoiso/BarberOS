using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Domain.Posts;

namespace BarberOS.Application.Posts.Commands.AddCommentReaction;

public sealed record AddCommentReactionCommand(Guid CommentId, Guid UserId, ReactionType Type) : ICommand;
