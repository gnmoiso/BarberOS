using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Catalog.Commands.DeleteService;

public sealed record DeleteServiceCommand(Guid Id) : ICommand;
