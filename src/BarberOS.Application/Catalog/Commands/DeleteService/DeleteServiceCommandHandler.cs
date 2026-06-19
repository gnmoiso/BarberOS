using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Catalog.Commands.DeleteService;

internal sealed class DeleteServiceCommandHandler(
    IServiceRepository services,
    IUnitOfWork uow) : ICommandHandler<DeleteServiceCommand>
{
    public async Task<Unit> Handle(DeleteServiceCommand cmd, CancellationToken ct)
    {
        var service = await services.FindByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("SERVICE_NOT_FOUND", $"Service {cmd.Id} not found.");

        services.Remove(service);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
