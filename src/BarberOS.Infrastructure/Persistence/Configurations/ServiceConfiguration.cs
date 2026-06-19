using BarberOS.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.ToTable("services");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).HasMaxLength(150).IsRequired();
        builder.Property(s => s.Description).HasMaxLength(500);
        builder.Property(s => s.Category).HasMaxLength(100);
        builder.Property(s => s.Currency).HasMaxLength(3).IsRequired();
        builder.Property(s => s.Price).HasColumnType("numeric(12,2)");
        builder.HasQueryFilter(s => !s.IsDeleted);
    }
}
