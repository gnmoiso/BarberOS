using BarberOS.Domain.Common;

namespace BarberOS.Domain.Catalog;

public sealed class Service : BaseAuditableEntity
{
    private Service() { }

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int DurationMinutes { get; private set; }
    public decimal Price { get; private set; }
    public string Currency { get; private set; } = "COP";
    public string? Category { get; private set; }
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }

    public static Service Create(Guid tenantId, string name, int durationMinutes, decimal price, string? description = null, string? category = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (durationMinutes <= 0) throw new ArgumentOutOfRangeException(nameof(durationMinutes));
        if (price < 0) throw new ArgumentOutOfRangeException(nameof(price));

        return new Service
        {
            TenantId = tenantId,
            Name = name.Trim(),
            Description = description?.Trim(),
            DurationMinutes = durationMinutes,
            Price = price,
            Category = category?.Trim(),
            IsActive = true,
        };
    }

    public void Update(string name, int durationMinutes, decimal price, string? description, string? category)
    {
        Name = name.Trim();
        DurationMinutes = durationMinutes;
        Price = price;
        Description = description?.Trim();
        Category = category?.Trim();
    }

    public void SetActive(bool active) => IsActive = active;
    public void SetSortOrder(int order) => SortOrder = order;
}
