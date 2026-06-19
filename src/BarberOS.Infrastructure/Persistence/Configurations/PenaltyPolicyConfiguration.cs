using BarberOS.Domain.Policies;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class PenaltyPolicyConfiguration : IEntityTypeConfiguration<PenaltyPolicy>
{
    public void Configure(EntityTypeBuilder<PenaltyPolicy> builder)
    {
        builder.ToTable("penalty_policies");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.PenaltyPercentage).HasColumnType("numeric(5,2)");
        builder.Property(p => p.MaxPenaltyAmount).HasColumnType("numeric(12,2)");
        builder.HasIndex(p => p.TenantId).IsUnique();
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}
