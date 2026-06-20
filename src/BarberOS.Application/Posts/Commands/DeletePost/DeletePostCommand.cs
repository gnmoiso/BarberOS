using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Posts.Commands.DeletePost;

/// <summary>
/// <paramref name="RequesterUserId"/> is null when called by the SuperAdmin (who may delete any
/// post). For everyone else, the post's AuthorId must match — only the author of a post can
/// delete it, not just any barber from the same barbershop (23.12.11).
/// </summary>
public sealed record DeletePostCommand(Guid PostId, Guid? RequesterUserId) : ICommand;
