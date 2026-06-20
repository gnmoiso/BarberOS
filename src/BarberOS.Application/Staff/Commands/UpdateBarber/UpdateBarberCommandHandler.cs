using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Staff.Commands.CreateBarber;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Staff.Commands.UpdateBarber;

internal sealed class UpdateBarberCommandHandler(
    IBarberRepository barbers,
    IUnitOfWork uow) : ICommandHandler<UpdateBarberCommand, BarberResponse>
{
    public async Task<BarberResponse> Handle(UpdateBarberCommand cmd, CancellationToken ct)
    {
        PhoneValidation.EnsureValidIfProvided(cmd.Phone);

        var barber = await barbers.FindByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {cmd.Id} not found.");

        barber.Update(cmd.DisplayName, cmd.Phone, cmd.PhotoUrl);
        barber.SetActive(cmd.IsActive);
        await uow.SaveChangesAsync(ct);
        return CreateBarberCommandHandler.ToResponse(barber);
    }
}
