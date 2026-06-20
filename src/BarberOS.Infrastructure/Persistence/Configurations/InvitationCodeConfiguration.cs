using BarberOS.Domain.Barbershop;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class InvitationCodeConfiguration : IEntityTypeConfiguration<InvitationCode>
{
    public void Configure(EntityTypeBuilder<InvitationCode> builder)
    {
        builder.ToTable("invitation_codes");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Code).HasMaxLength(10).IsRequired();
        builder.Property(c => c.Label).HasMaxLength(100);
        builder.HasIndex(c => new { c.TenantId, c.Code }).IsUnique();
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}
