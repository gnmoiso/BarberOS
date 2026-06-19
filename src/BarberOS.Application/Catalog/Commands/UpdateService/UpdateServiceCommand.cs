using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Catalog.Commands.CreateService;

namespace BarberOS.Application.Catalog.Commands.UpdateService;

public sealed record UpdateServiceCommand(
    Guid Id,
    string Name,
    int DurationMinutes,
    decimal Price,
    string? Description,
    string? Category,
    bool IsActive) : ICommand<ServiceResponse>;
