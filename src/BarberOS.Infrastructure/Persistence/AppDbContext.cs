using BarberOS.Application.Abstractions;
using BarberOS.Domain.Appointments;
using BarberOS.Domain.Barbershop;
using BarberOS.Domain.Catalog;
using BarberOS.Domain.Customers;
using BarberOS.Domain.Identity;
using BarberOS.Domain.Licensing;
using BarberOS.Domain.Platform;
using BarberOS.Domain.Policies;
using BarberOS.Domain.Posts;
using BarberOS.Domain.Ratings;
using BarberOS.Domain.Staff;
using BarberOS.Domain.Tenants;
using Microsoft.EntityFrameworkCore;

namespace BarberOS.Infrastructure.Persistence;

public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ITenantProvider tenantProvider) : DbContext(options), IUnitOfWork
{
    // Platform-level (no tenant filter)
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserTenantRole> UserTenantRoles => Set<UserTenantRole>();
    public DbSet<BarbershipLicense> BarbershipLicenses => Set<BarbershipLicense>();
    public DbSet<PlatformSettings> PlatformSettings => Set<PlatformSettings>();

    // Tenant-scoped business entities
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Barber> Barbers => Set<Barber>();
    public DbSet<WorkSchedule> WorkSchedules => Set<WorkSchedule>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AppointmentAddOn> AppointmentAddOns => Set<AppointmentAddOn>();
    public DbSet<PenaltyPolicy> PenaltyPolicies => Set<PenaltyPolicy>();
    public DbSet<NoShowPolicy> NoShowPolicies => Set<NoShowPolicy>();
    public DbSet<InvitationCode> InvitationCodes => Set<InvitationCode>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<BarbershipSettings> BarbershipSettings => Set<BarbershipSettings>();
    public DbSet<ServiceRating> ServiceRatings => Set<ServiceRating>();
    public DbSet<CustomerRating> CustomerRatings => Set<CustomerRating>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PostComment> PostComments => Set<PostComment>();
    public DbSet<PostReaction> PostReactions => Set<PostReaction>();
    public DbSet<CommentReaction> CommentReactions => Set<CommentReaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<UserTenantRole>()
            .HasQueryFilter(r => GetTenantId() == Guid.Empty || r.TenantId == GetTenantId());

        base.OnModelCreating(modelBuilder);
    }

    private Guid GetTenantId() => tenantProvider.TenantId ?? Guid.Empty;
}
