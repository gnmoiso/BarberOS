using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Catalog.Commands.CreateService;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Catalog.Commands.UpdateService;

internal sealed class UpdateServiceCommandHandler(
    IServiceRepository services,
    IUnitOfWork uow) : ICommandHandler<UpdateServiceCommand, ServiceResponse>
{
    public async Task<ServiceResponse> Handle(UpdateServiceCommand cmd, CancellationToken ct)
    {
        var service = await services.FindByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("SERVICE_NOT_FOUND", $"Service {cmd.Id} not found.");

        service.Update(cmd.Name, cmd.DurationMinutes, cmd.Price, cmd.Description, cmd.Category);
        service.SetActive(cmd.IsActive);
        await uow.SaveChangesAsync(ct);
        return CreateServiceCommandHandler.ToResponse(service);
    }
}
