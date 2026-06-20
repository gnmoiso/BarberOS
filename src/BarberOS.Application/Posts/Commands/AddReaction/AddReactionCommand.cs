using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Domain.Posts;

namespace BarberOS.Application.Posts.Commands.AddReaction;

public sealed record AddReactionCommand(Guid PostId, Guid UserId, ReactionType Type) : ICommand;
