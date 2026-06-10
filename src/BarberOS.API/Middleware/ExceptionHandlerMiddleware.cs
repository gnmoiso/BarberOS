using BarberOS.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Middleware;

internal sealed class ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DomainException ex)
        {
            logger.LogWarning(ex, "Domain exception: {ErrorCode}", ex.ErrorCode);
            await WriteProblemAsync(context, ex);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "Error interno del servidor.",
                Extensions = { ["traceId"] = context.TraceIdentifier },
            });
        }
    }

    private static Task WriteProblemAsync(HttpContext context, DomainException ex)
    {
        var status = ex switch
        {
            NotFoundException => StatusCodes.Status404NotFound,
            UnauthorizedException => StatusCodes.Status401Unauthorized,
            ForbiddenException => StatusCodes.Status403Forbidden,
            ConflictException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status422UnprocessableEntity,
        };

        context.Response.StatusCode = status;
        return context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = ex.Message,
            Extensions =
            {
                ["errorCode"] = ex.ErrorCode,
                ["traceId"] = context.TraceIdentifier,
            },
        });
    }
}
