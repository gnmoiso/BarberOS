namespace BarberOS.Domain.Common;

/// <summary>
/// Mandatory base for every business entity (docs/03-modelo-datos.md §2).
/// Audit fields are populated by an EF Core interceptor, never by hand.
/// Soft delete only: rows are never physically removed.
/// </summary>
public abstract class BaseAuditableEntity : BaseEntity
{
    /// <summary>Tenant isolation key. Filled by tenancy infrastructure (Phase 3); platform-global entities override this convention explicitly.</summary>
    public Guid TenantId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public bool IsDeleted { get; set; }
}
