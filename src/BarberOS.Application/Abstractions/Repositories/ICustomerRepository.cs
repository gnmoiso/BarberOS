using BarberOS.Domain.Customers;

namespace BarberOS.Application.Abstractions.Repositories;

public interface ICustomerRepository
{
    Task<Customer?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<Customer?> FindByPhoneAsync(Guid tenantId, string phone, CancellationToken ct = default);
    Task<IReadOnlyList<Customer>> SearchAsync(Guid tenantId, string? query, int page, int size, CancellationToken ct = default);
    Task<int> CountAsync(Guid tenantId, string? query, CancellationToken ct = default);
    void Add(Customer customer);
}
