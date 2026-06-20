using BarberOS.Domain.Appointments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class AppointmentAddOnConfiguration : IEntityTypeConfiguration<AppointmentAddOn>
{
    public void Configure(EntityTypeBuilder<AppointmentAddOn> builder)
    {
        builder.ToTable("appointment_add_ons");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).HasMaxLength(150).IsRequired();
        builder.Property(a => a.Price).HasColumnType("numeric(12,2)");
        builder.HasIndex(a => a.AppointmentId);
        builder.HasQueryFilter(a => !a.IsDeleted);
    }
}
