using BarberOS.Domain.Common;

namespace BarberOS.Domain.Barbershop;

/// <summary>
/// One-time opinion a barbershop submits about the platform.
/// SuperAdmin decides which ones appear on Home (max 3) or Login page.
/// </summary>
public sealed class Testimonial : BaseAuditableEntity
{
    private Testimonial() { }

    public string Content { get; private set; } = string.Empty;
    public string AuthorName { get; private set; } = string.Empty;
    public string BarbershipName { get; private set; } = string.Empty;
    public bool ShowOnHome { get; private set; }
    public bool ShowOnLogin { get; private set; }

    public static Testimonial Create(Guid tenantId, string content, string authorName, string barbershipName) =>
        new() { TenantId = tenantId, Content = content, AuthorName = authorName, BarbershipName = barbershipName };

    public void Update(string content, string authorName, string barbershipName)
    {
        Content = content;
        AuthorName = authorName;
        BarbershipName = barbershipName;
    }

    public void SetVisibility(bool showOnHome, bool showOnLogin)
    {
        ShowOnHome = showOnHome;
        ShowOnLogin = showOnLogin;
    }
}
