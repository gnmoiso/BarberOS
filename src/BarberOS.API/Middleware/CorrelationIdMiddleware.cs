using Serilog.Context;

namespace BarberOS.API.Middleware;

/// <summary>
/// Accepts or generates X-Correlation-Id, always generates X-Request-Id,
/// echoes both on the response and pushes them into the log context
/// (docs/08-observabilidad.md §2).
/// </summary>
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string CorrelationHeader = "X-Correlation-Id";
    public const string RequestHeader = "X-Request-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(CorrelationHeader, out var incoming)
                            && !string.IsNullOrWhiteSpace(incoming)
            ? incoming.ToString()
            : Guid.CreateVersion7().ToString();

        var requestId = Guid.CreateVersion7().ToString();

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationHeader] = correlationId;
            context.Response.Headers[RequestHeader] = requestId;
            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("correlation_id", correlationId))
        using (LogContext.PushProperty("request_id", requestId))
        {
            await next(context);
        }
    }
}
