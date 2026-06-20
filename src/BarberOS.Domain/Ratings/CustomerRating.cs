using BarberOS.Domain.Common;

namespace BarberOS.Domain.Ratings;

/// <summary>Barber optionally rates a customer after an appointment.</summary>
public sealed class CustomerRating : BaseAuditableEntity
{
    private CustomerRating() { }

    public Guid AppointmentId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid BarberId { get; private set; }
    public int Stars { get; private set; }
    public string? Notes { get; private set; }

    public static CustomerRating Create(Guid appointmentId, Guid customerId, Guid barberId, int stars, string? notes)
    {
        if (stars is < 1 or > 5) throw new ArgumentOutOfRangeException(nameof(stars));
        return new CustomerRating
        {
            AppointmentId = appointmentId,
            CustomerId = customerId,
            BarberId = barberId,
            Stars = stars,
            Notes = notes?.Trim(),
        };
    }
}
