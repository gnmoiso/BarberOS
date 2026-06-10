using BarberOS.Domain.Common;
using Xunit;

namespace BarberOS.Domain.Tests.Common;

public class BaseEntityTests
{
    private sealed class TestEntity : BaseEntity
    {
        public void Raise(IDomainEvent domainEvent) => RaiseDomainEvent(domainEvent);
    }

    private sealed record TestEvent : DomainEvent;

    [Fact]
    public void NewEntity_GetsTimeOrderedUuidV7Id()
    {
        var first = new TestEntity();
        var second = new TestEntity();

        Assert.NotEqual(Guid.Empty, first.Id);
        Assert.NotEqual(first.Id, second.Id);
        Assert.Equal(7, first.Id.Version);
    }

    [Fact]
    public void RaiseDomainEvent_AccumulatesUntilCleared()
    {
        var entity = new TestEntity();
        entity.Raise(new TestEvent());
        entity.Raise(new TestEvent());

        Assert.Equal(2, entity.DomainEvents.Count);

        entity.ClearDomainEvents();

        Assert.Empty(entity.DomainEvents);
    }
}
