using BarberOS.Domain.Licensing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class BarbershipLicenseConfiguration : IEntityTypeConfiguration<BarbershipLicense>
{
    public void Configure(EntityTypeBuilder<BarbershipLicense> builder)
    {
        builder.ToTable("barbership_licenses");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Code).HasMaxLength(20).IsRequired();
        builder.Property(l => l.Notes).HasMaxLength(500);
        builder.HasIndex(l => l.Code).IsUnique();
        builder.HasIndex(l => l.TenantId);
    }
}
