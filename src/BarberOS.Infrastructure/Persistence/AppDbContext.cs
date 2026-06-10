using BarberOS.Application.Abstractions;
using BarberOS.Domain.Identity;
using BarberOS.Domain.Tenants;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Persistence;

/// <summary>
/// Single DbContext for the pooled multi-tenant database (ADR-002).
/// Global query filters enforce soft-delete and tenant isolation at ORM level;
/// PostgreSQL RLS provides the second defense (infrastructure layer, applied by migration).
/// </summary>
public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ITenantProvider tenantProvider) : DbContext(options), IUnitOfWork
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserTenantRole> UserTenantRoles => Set<UserTenantRole>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Tenant-scoped filter re-evaluates tenantProvider.TenantId per query execution.
        // When TenantId is null (platform operations, tests) defaults to Guid.Empty → returns no rows safely.
        modelBuilder.Entity<UserTenantRole>()
            .HasQueryFilter(r => GetTenantId() == Guid.Empty || r.TenantId == GetTenantId());

        base.OnModelCreating(modelBuilder);
    }

    private Guid GetTenantId() => tenantProvider.TenantId ?? Guid.Empty;
}
