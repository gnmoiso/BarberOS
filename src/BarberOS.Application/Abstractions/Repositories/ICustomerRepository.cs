using BarberOS.Domain.Customers;

namespace BarberOS.Application.Abstractions.Repositories;

public interface ICustomerRepository
{
    Task<Customer?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<Customer?> FindByPhoneAsync(Guid tenantId, string phone, CancellationToken ct = default);
    Task<Customer?> FindByUserIdAsync(Guid tenantId, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<Customer>> SearchAsync(Guid tenantId, string? query, int page, int size, CancellationToken ct = default);
    Task<int> CountAsync(Guid tenantId, string? query, CancellationToken ct = default);

    /// <summary>Every CRM Customer record linked to this user, across every barbershop they belong
    /// to — needed for the user-wide (not tenant-wide) one-active-appointment rule (23.16.4/23.16.5).</summary>
    Task<List<Customer>> ListByUserIdAcrossTenantsAsync(Guid userId, CancellationToken ct = default);

    Task<List<string>> ListAllPhonesAsync(CancellationToken ct = default);

    /// <summary>Every customer across every tenant — platform-wide view for SuperAdmin.</summary>
    Task<List<Customer>> ListAllAsync(CancellationToken ct = default);

    void Add(Customer customer);
}
