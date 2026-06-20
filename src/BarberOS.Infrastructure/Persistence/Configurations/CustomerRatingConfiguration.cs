using BarberOS.Domain.Ratings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class CustomerRatingConfiguration : IEntityTypeConfiguration<CustomerRating>
{
    public void Configure(EntityTypeBuilder<CustomerRating> builder)
    {
        builder.ToTable("customer_ratings");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Stars).IsRequired();
        builder.Property(r => r.Notes).HasMaxLength(1000);
        builder.HasIndex(r => r.AppointmentId).IsUnique();
        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
