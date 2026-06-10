using BarberOS.Application.Abstractions;

namespace BarberOS.Infrastructure.Identity;

/// <summary>Placeholder until authentication lands in Phase 2.</summary>
public sealed class NullCurrentUser : ICurrentUser
{
    public Guid? UserId => null;
}
