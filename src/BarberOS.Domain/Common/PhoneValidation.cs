namespace BarberOS.Domain.Common;

/// <summary>
/// Colombian phone rule (23.17.3/23.17.4): exactly 10 digits, numbers only. Only applied where a
/// human actually typed the phone (registration, profile, barber/customer forms) — never to
/// system-generated placeholder phones used internally when a user has none on file.
/// </summary>
public static class PhoneValidation
{
    /// <summary>Phone is required in this context — null/empty fails too.</summary>
    public static void EnsureValid(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            throw new ValidationException("phone.required", "El número debe tener 10 dígitos.");

        EnsureValidIfProvided(phone);
    }

    /// <summary>Phone is optional in this context (e.g. registration) — only validates format
    /// when the caller actually supplied one.</summary>
    public static void EnsureValidIfProvided(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return;

        if (!phone.All(char.IsDigit))
            throw new ValidationException("phone.invalid_chars", "Solo se permiten números.");

        if (phone.Length < 10)
            throw new ValidationException("phone.too_short", "El número debe tener 10 dígitos.");

        if (phone.Length > 10)
            throw new ValidationException("phone.too_long", "El número debe tener exactamente 10 dígitos.");
    }
}
