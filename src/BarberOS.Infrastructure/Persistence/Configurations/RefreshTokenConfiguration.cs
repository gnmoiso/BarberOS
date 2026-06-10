using BarberOS.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        builder.Property(t => t.FamilyId).HasMaxLength(36).IsRequired();
        builder.Property(t => t.CreatedIp).HasMaxLength(45).IsRequired();

        // O(1) token lookup
        builder.HasIndex(t => t.TokenHash).IsUnique();
        // Revoke entire family efficiently
        builder.HasIndex(t => t.FamilyId);
    }
}
