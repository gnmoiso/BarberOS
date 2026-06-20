namespace BarberOS.Domain.Common;

public abstract class DomainException(string errorCode, string message) : Exception(message)
{
    public string ErrorCode { get; } = errorCode;
}

public sealed class NotFoundException(string errorCode, string message)
    : DomainException(errorCode, message);

public sealed class UnauthorizedException(string errorCode, string message)
    : DomainException(errorCode, message);

public sealed class ConflictException(string errorCode, string message)
    : DomainException(errorCode, message);

public sealed class ForbiddenException(string errorCode, string message)
    : DomainException(errorCode, message);

public sealed class ValidationException(string errorCode, string message)
    : DomainException(errorCode, message);
