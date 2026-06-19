using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Staff.Commands.CreateBarber;

public sealed record CreateBarberCommand(
    string DisplayName,
    string? Phone,
    Guid? UserId) : ICommand<BarberResponse>;

public sealed record BarberResponse(
    Guid Id,
    string DisplayName,
    string? Phone,
    string? PhotoUrl,
    bool IsActive);
