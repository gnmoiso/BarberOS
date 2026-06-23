using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.DeleteTenant;

/// <summary>Soft-deletes a barbershop. Members keep their User accounts (other tenant
/// memberships are unaffected) but lose access to this tenant immediately — the next request
/// with this tenant_id fails tenant resolution (TenantResolutionMiddleware).</summary>
internal sealed class DeleteTenantCommandHandler(
    ITenantRepository tenants,
    IUnitOfWork uow) : ICommandHandler<DeleteTenantCommand>
{
    public async Task<Unit> Handle(DeleteTenantCommand cmd, CancellationToken ct)
    {
        var tenant = await tenants.FindByIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("tenant.not_found", "Barbería no encontrada.");

        tenant.IsDeleted = true;
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
