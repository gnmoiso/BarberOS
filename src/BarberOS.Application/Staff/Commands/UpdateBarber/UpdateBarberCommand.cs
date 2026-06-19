using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Staff.Commands.CreateBarber;

namespace BarberOS.Application.Staff.Commands.UpdateBarber;

public sealed record UpdateBarberCommand(
    Guid Id,
    string DisplayName,
    string? Phone,
    string? PhotoUrl,
    bool IsActive) : ICommand<BarberResponse>;
