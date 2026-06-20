using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.Staff.Commands.DeleteBarber;

internal sealed class DeleteBarberCommandHandler(
    IBarberRepository barbers, IUnitOfWork uow) : ICommandHandler<DeleteBarberCommand>
{
    public async Task<Unit> Handle(DeleteBarberCommand cmd, CancellationToken ct)
    {
        var barber = await barbers.FindByIdAsync(cmd.BarberId, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {cmd.BarberId} not found.");

        var schedule = await barbers.GetScheduleAsync(barber.Id, ct);
        foreach (var slot in schedule) barbers.RemoveSchedule(slot);

        barbers.Remove(barber);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
