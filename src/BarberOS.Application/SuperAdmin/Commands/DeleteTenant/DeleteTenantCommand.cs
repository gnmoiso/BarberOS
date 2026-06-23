using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.DeleteTenant;

public sealed record DeleteTenantCommand(Guid TenantId) : ICommand;
