using BarberOS.Domain.Barbershop;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class BarbershipSettingsConfiguration : IEntityTypeConfiguration<BarbershipSettings>
{
    public void Configure(EntityTypeBuilder<BarbershipSettings> builder)
    {
        builder.ToTable("barbership_settings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Currency).HasMaxLength(3);
        builder.Property(s => s.BasePriceNoService).HasPrecision(10, 2);
        builder.Property(s => s.BeardPrice).HasPrecision(10, 2);
        builder.Property(s => s.EyebrowPrice).HasPrecision(10, 2);
        builder.Property(s => s.WashPrice).HasPrecision(10, 2);
        builder.Property(s => s.Address).HasMaxLength(500);
        builder.Property(s => s.OwnerName).HasMaxLength(200);
        builder.Property(s => s.ReminderMinutesBeforeAppointment).HasDefaultValue(20);
        builder.HasIndex(s => s.TenantId).IsUnique();
        builder.HasQueryFilter(s => !s.IsDeleted);
    }
}
