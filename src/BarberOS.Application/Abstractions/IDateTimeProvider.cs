namespace BarberOS.Application.Abstractions;

/// <summary>Testable clock. All persisted timestamps are UTC; tenant timezone is presentation concern.</summary>
public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}
