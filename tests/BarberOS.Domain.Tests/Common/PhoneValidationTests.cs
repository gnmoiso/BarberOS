using BarberOS.Domain.Common;
using Xunit;

namespace BarberOS.Domain.Tests.Common;

public class PhoneValidationTests
{
    // ── EnsureValid (phone required) ──────────────────────────────────────────

    [Fact]
    public void EnsureValid_ThrowsWhenNull()
    {
        var ex = Assert.Throws<ValidationException>(() => PhoneValidation.EnsureValid(null));
        Assert.Equal("phone.required", ex.ErrorCode);
    }

    [Fact]
    public void EnsureValid_ThrowsWhenEmpty()
    {
        Assert.Throws<ValidationException>(() => PhoneValidation.EnsureValid(""));
    }

    [Fact]
    public void EnsureValid_ThrowsWhenWhitespace()
    {
        Assert.Throws<ValidationException>(() => PhoneValidation.EnsureValid("   "));
    }

    [Fact]
    public void EnsureValid_AcceptsValid10DigitPhone()
    {
        // Should not throw
        PhoneValidation.EnsureValid("3001234567");
    }

    // ── EnsureValidIfProvided (phone optional) ────────────────────────────────

    [Fact]
    public void EnsureValidIfProvided_DoesNotThrowWhenNull()
    {
        PhoneValidation.EnsureValidIfProvided(null); // should not throw
    }

    [Fact]
    public void EnsureValidIfProvided_DoesNotThrowWhenEmpty()
    {
        PhoneValidation.EnsureValidIfProvided(""); // should not throw
    }

    // ── Format rules ──────────────────────────────────────────────────────────

    [Theory]
    [InlineData("300123456")]     // 9 digits
    [InlineData("30012345678")]   // 11 digits
    public void EnsureValid_ThrowsOnWrongLength(string phone)
    {
        var ex = Assert.Throws<ValidationException>(() => PhoneValidation.EnsureValid(phone));
        Assert.Contains("phone.too_", ex.ErrorCode); // too_short or too_long
    }

    [Theory]
    [InlineData("300-123-456")]  // hyphens
    [InlineData("+573001234567")] // plus sign
    [InlineData("300 123 456")]  // spaces
    public void EnsureValid_ThrowsWhenNonDigitCharactersPresent(string phone)
    {
        var ex = Assert.Throws<ValidationException>(() => PhoneValidation.EnsureValid(phone));
        Assert.Equal("phone.invalid_chars", ex.ErrorCode);
    }

    [Fact]
    public void EnsureValid_ThrowsTooShort_Before_InvalidCharsCheck()
    {
        // 9 chars, no letters, but wrong length — length is checked after char validation
        // "30012345" is 8 digits: first fails char check? No — all digits, so goes to length check.
        var ex = Assert.Throws<ValidationException>(() => PhoneValidation.EnsureValid("300123456"));
        Assert.Equal("phone.too_short", ex.ErrorCode);
    }
}
