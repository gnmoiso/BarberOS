using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.DeleteCustomer;

internal sealed class DeleteCustomerCommandHandler(
    ICustomerRepository customers,
    IUnitOfWork uow) : ICommandHandler<DeleteCustomerCommand>
{
    public async Task<Unit> Handle(DeleteCustomerCommand cmd, CancellationToken ct)
    {
        var customer = await customers.FindByIdAsync(cmd.CustomerId, ct)
            ?? throw new NotFoundException("customer.not_found", "Cliente no encontrado.");

        customer.IsDeleted = true;
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
