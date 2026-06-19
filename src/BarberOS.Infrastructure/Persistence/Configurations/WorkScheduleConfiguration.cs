using BarberOS.Domain.Staff;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class WorkScheduleConfiguration : IEntityTypeConfiguration<WorkSchedule>
{
    public void Configure(EntityTypeBuilder<WorkSchedule> builder)
    {
        builder.ToTable("work_schedules");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Weekday).HasConversion<int>();
        builder.HasQueryFilter(w => !w.IsDeleted);
    }
}
