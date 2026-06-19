using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Staff;

namespace BarberOS.Application.Staff.Commands.SetSchedule;

internal sealed class SetScheduleCommandHandler(
    IBarberRepository barbers,
    ITenantProvider tenantProvider,
    IUnitOfWork uow) : ICommandHandler<SetScheduleCommand>
{
    public async Task<Unit> Handle(SetScheduleCommand cmd, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;
        var barber = await barbers.FindByIdAsync(cmd.BarberId, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {cmd.BarberId} not found.");

        var existing = await barbers.GetScheduleAsync(barber.Id, ct);
        foreach (var slot in existing) barbers.RemoveSchedule(slot);

        foreach (var slot in cmd.Slots)
        {
            var schedule = WorkSchedule.Create(tenantId, barber.Id, slot.Weekday, slot.StartTime, slot.EndTime);
            barbers.AddSchedule(schedule);
        }

        await uow.SaveChangesAsync(ct);
        return default;
    }
}
