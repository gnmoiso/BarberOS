using BarberOS.Domain.Common;

namespace BarberOS.Domain.Tenants.Events;

public sealed record TenantCreatedEvent(Guid TenantId, string Slug) : DomainEvent;
