using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Catalog.Commands.CreateService;

public sealed record CreateServiceCommand(
    string Name,
    int DurationMinutes,
    decimal Price,
    string? Description,
    string? Category) : ICommand<ServiceResponse>;

public sealed record ServiceResponse(
    Guid Id,
    string Name,
    int DurationMinutes,
    decimal Price,
    string Currency,
    string? Description,
    string? Category,
    bool IsActive);
