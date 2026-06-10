namespace BarberOS.Application.Abstractions.Messaging;

/// <summary>CQRS write request (docs/01-arquitectura.md §4). Minimal in-house dispatcher per ADR-001 (no external mediator dependency).</summary>
public interface ICommand<TResponse>;

public interface ICommandHandler<in TCommand, TResponse>
    where TCommand : ICommand<TResponse>
{
    Task<TResponse> Handle(TCommand command, CancellationToken cancellationToken);
}
