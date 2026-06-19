using BarberOS.Domain.Common;

namespace BarberOS.Domain.Staff;

public sealed class Barber : BaseAuditableEntity
{
    private Barber() { }

    public Guid? UserId { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public string? PhotoUrl { get; private set; }
    public string? Phone { get; private set; }
    public bool IsActive { get; private set; }

    public static Barber Create(Guid tenantId, string displayName, Guid? userId = null, string? phone = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);

        return new Barber
        {
            TenantId = tenantId,
            DisplayName = displayName.Trim(),
            UserId = userId,
            Phone = phone?.Trim(),
            IsActive = true,
        };
    }

    public void Update(string displayName, string? phone, string? photoUrl)
    {
        DisplayName = displayName.Trim();
        Phone = phone?.Trim();
        PhotoUrl = photoUrl?.Trim();
    }

    public void SetActive(bool active) => IsActive = active;
}
