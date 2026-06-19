using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Catalog;

namespace BarberOS.Application.Catalog.Commands.CreateService;

internal sealed class CreateServiceCommandHandler(
    IServiceRepository services,
    ITenantProvider tenantProvider,
    IUnitOfWork uow) : ICommandHandler<CreateServiceCommand, ServiceResponse>
{
    public async Task<ServiceResponse> Handle(CreateServiceCommand cmd, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var service = Service.Create(tenantId, cmd.Name, cmd.DurationMinutes, cmd.Price, cmd.Description, cmd.Category);
        services.Add(service);
        await uow.SaveChangesAsync(ct);
        return ToResponse(service);
    }

    internal static ServiceResponse ToResponse(Service s) =>
        new(s.Id, s.Name, s.DurationMinutes, s.Price, s.Currency, s.Description, s.Category, s.IsActive);
}
