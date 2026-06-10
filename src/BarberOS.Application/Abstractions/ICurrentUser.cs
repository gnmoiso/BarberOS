namespace BarberOS.Application.Abstractions;

/// <summary>
/// Identity of the acting user for auditing. Real implementation arrives with
/// authentication (Phase 2); until then infrastructure provides a null identity.
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
}
