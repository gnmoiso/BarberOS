using BarberOS.Domain.Common;

namespace BarberOS.Domain.Platform;

/// <summary>
/// Singleton row — platform contact info editable only by SuperAdmin.
/// Barbers who register see this info on their "contact BarberOS" screen.
/// </summary>
public sealed class PlatformSettings : BaseEntity
{
    public static readonly Guid SingletonId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    private PlatformSettings() { }

    public string ContactPhone { get; private set; } = string.Empty;
    public string ContactEmail { get; private set; } = string.Empty;
    public string ContactWhatsApp { get; private set; } = string.Empty;
    public string ContactMessage { get; private set; } = "Contáctanos para activar tu barbería en la plataforma.";
    public string? LogoUrl { get; private set; }

    public static PlatformSettings Create() => new() { Id = SingletonId };

    public void Update(string? phone, string? email, string? whatsApp, string? message)
    {
        ContactPhone = phone ?? string.Empty;
        ContactEmail = email ?? string.Empty;
        ContactWhatsApp = whatsApp ?? string.Empty;
        ContactMessage = message ?? ContactMessage;
    }

    /// <summary>Logo is always an uploaded file served from /uploads — never an external URL (23.11.10).</summary>
    public void SetLogo(string? logoUrl) => LogoUrl = logoUrl;
}
