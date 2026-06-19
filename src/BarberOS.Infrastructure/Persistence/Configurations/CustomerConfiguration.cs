using BarberOS.Domain.Customers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.FullName).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(30).IsRequired();
        builder.Property(c => c.WhatsappPhone).HasMaxLength(30);
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.Property(c => c.Notes).HasMaxLength(1000);
        builder.Property(c => c.BookingBlockReason).HasMaxLength(500);
        builder.HasIndex(c => new { c.TenantId, c.Phone }).IsUnique();
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}
