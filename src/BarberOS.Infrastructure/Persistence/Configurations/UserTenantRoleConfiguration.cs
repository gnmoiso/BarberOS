using BarberOS.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarberOS.Infrastructure.Persistence.Configurations;

internal sealed class UserTenantRoleConfiguration : IEntityTypeConfiguration<UserTenantRole>
{
    public void Configure(EntityTypeBuilder<UserTenantRole> builder)
    {
        builder.ToTable("users_tenant_roles");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.InvitationCodeUsed).HasMaxLength(10);
        builder.HasIndex(r => new { r.UserId, r.TenantId }).IsUnique();
    }
}
