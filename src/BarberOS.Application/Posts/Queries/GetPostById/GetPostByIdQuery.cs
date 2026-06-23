using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Posts.Queries.ListPosts;

namespace BarberOS.Application.Posts.Queries.GetPostById;

/// <summary>Fetches a single post already mapped to the same <see cref="PostDto"/> shape as
/// ListPostsQuery — used by the real-time feed to patch just the post that changed (new
/// reaction/comment) instead of re-fetching and re-rendering the entire feed.</summary>
public sealed record GetPostByIdQuery(Guid PostId, Guid? ViewerId = null) : ICommand<PostDto?>;
