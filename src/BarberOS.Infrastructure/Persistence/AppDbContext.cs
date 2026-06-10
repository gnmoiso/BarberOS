using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Persistence;

/// <summary>
/// Single DbContext for the pooled multi-tenant database (ADR-002).
/// Entity configurations are discovered from this assembly; business DbSets
/// arrive with their modules in later phases.
/// </summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
