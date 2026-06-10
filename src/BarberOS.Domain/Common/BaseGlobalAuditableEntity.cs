namespace BarberOS.Domain.Common;

/// <summary>
/// Base for platform-level entities that have no tenant_id (tenants, users, plans).
/// Per-tenant business entities use <see cref="BaseAuditableEntity"/> instead.
/// </summary>
public abstract class BaseGlobalAuditableEntity : BaseEntity, IAuditableEntity
{
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public bool IsDeleted { get; set; }
}
