using BarberOS.Domain.Appointments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("appointments");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ServiceName).HasMaxLength(150).IsRequired();
        builder.Property(a => a.ServicePrice).HasColumnType("numeric(12,2)");
        builder.Property(a => a.PenaltyAmount).HasColumnType("numeric(12,2)");
        builder.Property(a => a.PenaltyReason).HasMaxLength(500);
        builder.Property(a => a.CancellationReason).HasMaxLength(500);
        builder.Property(a => a.Notes).HasMaxLength(500);
        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(30);
        builder.HasIndex(a => new { a.TenantId, a.BarberId, a.StartsAt });
        builder.HasIndex(a => new { a.TenantId, a.CustomerId });
        builder.HasQueryFilter(a => !a.IsDeleted);
    }
}
