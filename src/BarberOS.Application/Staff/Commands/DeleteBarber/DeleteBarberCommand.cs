using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Staff.Commands.DeleteBarber;

public sealed record DeleteBarberCommand(Guid BarberId) : ICommand;
