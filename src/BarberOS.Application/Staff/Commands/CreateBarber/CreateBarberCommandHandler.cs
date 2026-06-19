using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Staff;

namespace BarberOS.Application.Staff.Commands.CreateBarber;

internal sealed class CreateBarberCommandHandler(
    IBarberRepository barbers,
    ITenantProvider tenantProvider,
    IUnitOfWork uow) : ICommandHandler<CreateBarberCommand, BarberResponse>
{
    public async Task<BarberResponse> Handle(CreateBarberCommand cmd, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var barber = Barber.Create(tenantId, cmd.DisplayName, cmd.UserId, cmd.Phone);
        barbers.Add(barber);
        await uow.SaveChangesAsync(ct);
        return ToResponse(barber);
    }

    internal static BarberResponse ToResponse(Barber b) =>
        new(b.Id, b.DisplayName, b.Phone, b.PhotoUrl, b.IsActive);
}
