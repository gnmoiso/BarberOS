using BarberOS.Domain.Common;

namespace BarberOS.Domain.Appointments;

public sealed class AppointmentAddOn : BaseAuditableEntity
{
    private AppointmentAddOn() { }

    public Guid AppointmentId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public decimal Price { get; private set; }

    public static AppointmentAddOn Create(Guid tenantId, Guid appointmentId, string name, decimal price)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.");
        if (price < 0) throw new ArgumentException("Price cannot be negative.");

        return new AppointmentAddOn
        {
            TenantId = tenantId,
            AppointmentId = appointmentId,
            Name = name.Trim(),
            Price = price,
        };
    }
}
