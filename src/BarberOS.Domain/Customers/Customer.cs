using BarberOS.Domain.Common;

namespace BarberOS.Domain.Customers;

public sealed class Customer : BaseAuditableEntity
{
    private Customer() { }

    public Guid? UserId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? WhatsappPhone { get; private set; }
    public string? Email { get; private set; }
    public string? Notes { get; private set; }
    public DateTimeOffset? FirstVisitAt { get; private set; }
    public DateTimeOffset? LastVisitAt { get; private set; }
    public DateTimeOffset? BookingBlockedUntil { get; private set; }
    public string? BookingBlockReason { get; private set; }

    public bool IsBlocked(DateTimeOffset now) =>
        BookingBlockedUntil.HasValue && BookingBlockedUntil.Value > now;

    public static Customer Create(Guid tenantId, string fullName, string phone, string? email = null, Guid? userId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        return new Customer
        {
            TenantId = tenantId,
            FullName = fullName.Trim(),
            Phone = phone.Trim(),
            Email = email?.Trim().ToLowerInvariant(),
            UserId = userId,
        };
    }

    public void Update(string fullName, string phone, string? whatsappPhone, string? email, string? notes)
    {
        FullName = fullName.Trim();
        Phone = phone.Trim();
        WhatsappPhone = whatsappPhone?.Trim();
        Email = email?.Trim().ToLowerInvariant();
        Notes = notes?.Trim();
    }

    public void RecordVisit(DateTimeOffset now)
    {
        FirstVisitAt ??= now;
        LastVisitAt = now;
    }

    public void Block(DateTimeOffset? until, string reason)
    {
        BookingBlockedUntil = until ?? DateTimeOffset.MaxValue;
        BookingBlockReason = reason;
    }

    public void Unblock()
    {
        BookingBlockedUntil = null;
        BookingBlockReason = null;
    }
}
