using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.DeleteLicense;

/// <summary>Deletes a license. If it was assigned to a tenant, that tenant's license is revoked
/// immediately — the barber loses panel access on their next request, not just next login.</summary>
public sealed record DeleteLicenseCommand(Guid LicenseId) : ICommand;
