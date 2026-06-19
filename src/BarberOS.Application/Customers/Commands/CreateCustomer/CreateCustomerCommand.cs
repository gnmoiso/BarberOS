using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Customers.Commands.CreateCustomer;

public sealed record CreateCustomerCommand(
    string FullName,
    string Phone,
    string? Email,
    string? WhatsappPhone) : ICommand<CustomerResponse>;

public sealed record CustomerResponse(
    Guid Id,
    string FullName,
    string Phone,
    string? Email,
    string? WhatsappPhone,
    string? Notes,
    DateTimeOffset? LastVisitAt,
    bool IsBlocked);
