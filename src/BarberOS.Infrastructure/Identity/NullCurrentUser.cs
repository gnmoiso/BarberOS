using BarberOS.Application.Abstractions;

namespace BarberOS.Infrastructure.Identity;

/// <summary>Fallback for non-HTTP contexts (background workers, tests).</summary>
public sealed class NullCurrentUser : ICurrentUser
{
    public Guid? UserId => null;
    public bool IsAuthenticated => false;
}
