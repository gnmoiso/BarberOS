using Microsoft.Extensions.DependencyInjection;

namespace BarberOS.Application.Abstractions.Messaging;

/// <summary>
/// Reflection-based dispatcher resolving the concrete handler from DI.
/// Cross-cutting behaviors (logging, validation, transaction) wrap handlers
/// via decoration as they are introduced during Phase 1.
/// </summary>
public sealed class Sender(IServiceProvider serviceProvider) : ISender
{
    public Task<TResponse> Send<TResponse>(ICommand<TResponse> command, CancellationToken cancellationToken = default) =>
        Dispatch<TResponse>(typeof(ICommandHandler<,>), command, cancellationToken);

    public Task<TResponse> Send<TResponse>(IQuery<TResponse> query, CancellationToken cancellationToken = default) =>
        Dispatch<TResponse>(typeof(IQueryHandler<,>), query, cancellationToken);

    private Task<TResponse> Dispatch<TResponse>(Type openHandlerType, object request, CancellationToken cancellationToken)
    {
        var handlerType = openHandlerType.MakeGenericType(request.GetType(), typeof(TResponse));
        var handler = serviceProvider.GetRequiredService(handlerType);
        var handleMethod = handlerType.GetMethod("Handle")
            ?? throw new InvalidOperationException($"Handler {handlerType.Name} does not expose a Handle method.");

        return (Task<TResponse>)handleMethod.Invoke(handler, [request, cancellationToken])!;
    }
}
