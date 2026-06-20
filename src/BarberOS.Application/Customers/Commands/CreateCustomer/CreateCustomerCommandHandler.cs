using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Customers;

namespace BarberOS.Application.Customers.Commands.CreateCustomer;

internal sealed class CreateCustomerCommandHandler(
    ICustomerRepository customers,
    ITenantProvider tenantProvider,
    IUnitOfWork uow) : ICommandHandler<CreateCustomerCommand, CustomerResponse>
{
    public async Task<CustomerResponse> Handle(CreateCustomerCommand cmd, CancellationToken ct)
    {
        PhoneValidation.EnsureValid(cmd.Phone);

        var tenantId = tenantProvider.TenantId!.Value;

        var existing = await customers.FindByPhoneAsync(tenantId, cmd.Phone, ct);
        if (existing is not null)
            throw new ConflictException("CUSTOMER_PHONE_EXISTS", "A customer with this phone number already exists.");

        var customer = Customer.Create(tenantId, cmd.FullName, cmd.Phone, cmd.Email);
        customers.Add(customer);
        await uow.SaveChangesAsync(ct);
        return ToResponse(customer);
    }

    internal static CustomerResponse ToResponse(Domain.Customers.Customer c) =>
        new(c.Id, c.FullName, c.Phone, c.Email, c.WhatsappPhone, c.Notes, c.LastVisitAt,
            c.IsBlocked(DateTimeOffset.UtcNow));
}
