namespace BarberOS.Application.Abstractions;

/// <summary>
/// Identity of the acting user. Audit interceptor reads UserId; authorization
/// reads IsAuthenticated and Roles.
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}
