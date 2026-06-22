using BarberOS.Domain.Barbershop;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class TestimonialConfiguration : IEntityTypeConfiguration<Testimonial>
{
    public void Configure(EntityTypeBuilder<Testimonial> builder)
    {
        builder.ToTable("testimonials");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Content).HasMaxLength(1000).IsRequired();
        builder.Property(t => t.AuthorName).HasMaxLength(200).IsRequired();
        builder.Property(t => t.BarbershipName).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(t => t.TenantId).IsUnique();
        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}
