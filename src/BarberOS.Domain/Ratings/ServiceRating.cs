using BarberOS.Domain.Common;

namespace BarberOS.Domain.Ratings;

/// <summary>Customer rates an appointment (1-5 stars). Mandatory to continue using the platform.</summary>
public sealed class ServiceRating : BaseAuditableEntity
{
    private ServiceRating() { }

    public Guid AppointmentId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid BarberId { get; private set; }
    public int Stars { get; private set; }
    public string? Comment { get; private set; }

    public static ServiceRating Create(Guid appointmentId, Guid customerId, Guid barberId, int stars, string? comment)
    {
        if (stars is < 1 or > 5) throw new ArgumentOutOfRangeException(nameof(stars), "Stars must be 1-5.");
        return new ServiceRating
        {
            AppointmentId = appointmentId,
            CustomerId = customerId,
            BarberId = barberId,
            Stars = stars,
            Comment = comment?.Trim(),
        };
    }
}
