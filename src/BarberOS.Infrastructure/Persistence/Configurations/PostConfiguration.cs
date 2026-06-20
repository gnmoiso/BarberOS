using BarberOS.Domain.Posts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable("posts");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Content).HasMaxLength(2000).IsRequired();
        builder.Property(p => p.ImageUrl).HasMaxLength(500);
        builder.HasMany(p => p.Reactions).WithOne().HasForeignKey(r => r.PostId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(p => p.Comments).WithOne().HasForeignKey(c => c.PostId).OnDelete(DeleteBehavior.Cascade);
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}

internal sealed class PostReactionConfiguration : IEntityTypeConfiguration<PostReaction>
{
    public void Configure(EntityTypeBuilder<PostReaction> builder)
    {
        builder.ToTable("post_reactions");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Type).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(r => new { r.PostId, r.UserId }).IsUnique();
    }
}

internal sealed class PostCommentConfiguration : IEntityTypeConfiguration<PostComment>
{
    public void Configure(EntityTypeBuilder<PostComment> builder)
    {
        builder.ToTable("post_comments");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Text).HasMaxLength(1000).IsRequired();
        builder.HasMany(c => c.Reactions).WithOne().HasForeignKey(r => r.CommentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}

internal sealed class CommentReactionConfiguration : IEntityTypeConfiguration<CommentReaction>
{
    public void Configure(EntityTypeBuilder<CommentReaction> builder)
    {
        builder.ToTable("comment_reactions");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Type).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(r => new { r.CommentId, r.UserId }).IsUnique();
    }
}
