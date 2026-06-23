using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.ListAllCustomers;

/// <summary>Every customer across every barbershop on the platform — SuperAdmin only.</summary>
public sealed record ListAllCustomersQuery : IQuery<List<PlatformCustomerDto>>;

public sealed record PlatformCustomerDto(
    Guid Id,
    Guid? UserId,
    string FullName,
    string Phone,
    string? Email,
    Guid TenantId,
    string TenantName,
    DateTimeOffset CreatedAt);
