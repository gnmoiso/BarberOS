using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Posts.Commands.CreatePost;

public sealed record CreatePostCommand(Guid TenantId, Guid AuthorId, string Content, string? ImageUrl) : ICommand<Guid>;
