using BarberOS.Domain.Tenants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Slug).HasMaxLength(100).IsRequired();
        builder.Property(t => t.LegalName).HasMaxLength(300);
        builder.Property(t => t.TaxId).HasMaxLength(20);
        builder.Property(t => t.Country).HasMaxLength(2).IsRequired();
        builder.Property(t => t.Timezone).HasMaxLength(50).IsRequired();
        builder.Property(t => t.Currency).HasMaxLength(3).IsRequired();
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(t => t.Slug).IsUnique().HasFilter("is_deleted = false");

        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}
