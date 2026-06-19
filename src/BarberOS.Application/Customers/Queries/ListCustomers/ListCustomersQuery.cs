using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Customers.Commands.CreateCustomer;

namespace BarberOS.Application.Customers.Queries.ListCustomers;

public sealed record ListCustomersQuery(string? Query, int Page = 1, int Size = 20) : IQuery<PagedResult<CustomerResponse>>;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int Size);
