using BarberOS.Domain.Staff;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class BarberConfiguration : IEntityTypeConfiguration<Barber>
{
    public void Configure(EntityTypeBuilder<Barber> builder)
    {
        builder.ToTable("barbers");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.DisplayName).HasMaxLength(150).IsRequired();
        builder.Property(b => b.Phone).HasMaxLength(30);
        builder.Property(b => b.PhotoUrl).HasMaxLength(500);
        builder.HasQueryFilter(b => !b.IsDeleted);
    }
}
