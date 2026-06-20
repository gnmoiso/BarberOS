using BarberOS.Domain.Platform;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class PlatformSettingsConfiguration : IEntityTypeConfiguration<PlatformSettings>
{
    public void Configure(EntityTypeBuilder<PlatformSettings> builder)
    {
        builder.ToTable("platform_settings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.ContactPhone).HasMaxLength(30);
        builder.Property(s => s.ContactEmail).HasMaxLength(320);
        builder.Property(s => s.ContactWhatsApp).HasMaxLength(30);
        builder.Property(s => s.ContactMessage).HasMaxLength(500);
    }
}
