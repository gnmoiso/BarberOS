namespace BarberOS.Domain.Common;

/// <summary>
/// Marker for in-process domain events, dispatched atomically on SaveChanges.
/// Integration events are persisted through the outbox (introduced later in Phase 1).
/// </summary>
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTimeOffset OccurredAt { get; }
}

public abstract record DomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.CreateVersion7();
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
