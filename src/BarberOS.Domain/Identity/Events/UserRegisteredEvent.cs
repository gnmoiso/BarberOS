using BarberOS.Domain.Common;

namespace BarberOS.Domain.Identity.Events;

public sealed record UserRegisteredEvent(Guid UserId, string Email) : DomainEvent;
