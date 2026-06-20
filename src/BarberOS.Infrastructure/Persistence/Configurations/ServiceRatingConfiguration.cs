using BarberOS.Domain.Ratings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class ServiceRatingConfiguration : IEntityTypeConfiguration<ServiceRating>
{
    public void Configure(EntityTypeBuilder<ServiceRating> builder)
    {
        builder.ToTable("service_ratings");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Stars).IsRequired();
        builder.Property(r => r.Comment).HasMaxLength(1000);
        builder.HasIndex(r => r.AppointmentId).IsUnique();
        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
