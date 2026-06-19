using BarberOS.Domain.Policies;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class NoShowPolicyConfiguration : IEntityTypeConfiguration<NoShowPolicy>
{
    public void Configure(EntityTypeBuilder<NoShowPolicy> builder)
    {
        builder.ToTable("noshow_policies");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.NoShowFeeAmount).HasColumnType("numeric(12,2)");
        builder.HasIndex(p => p.TenantId).IsUnique();
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}
