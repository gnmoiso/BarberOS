using BarberOS.Domain.Common;

namespace BarberOS.Domain.Barbershop;

/// <summary>
/// One testimonial per barbershop about the platform (23.20.11) — the barber writes it from
/// "Mi Testimonio", SuperAdmin approves/rejects it, and only Approved ones can ever be shown on
/// Home, Login or Register. Editing an already-approved testimonial resets it back to Pending —
/// SuperAdmin must re-review any change before it's public again.
/// </summary>
public sealed class Testimonial : BaseAuditableEntity
{
    private Testimonial() { }

    public string Content { get; private set; } = string.Empty;
    public string AuthorName { get; private set; } = string.Empty;
    public string BarbershipName { get; private set; } = string.Empty;
    public TestimonialStatus Status { get; private set; } = TestimonialStatus.Pending;
    public bool ShowOnHome { get; private set; }
    public bool ShowOnLogin { get; private set; }
    public bool ShowOnRegister { get; private set; }

    public static Testimonial Create(Guid tenantId, string content, string authorName, string barbershipName) =>
        new() { TenantId = tenantId, Content = content, AuthorName = authorName, BarbershipName = barbershipName };

    public void Update(string content, string authorName, string barbershipName)
    {
        Content = content;
        AuthorName = authorName;
        BarbershipName = barbershipName;
        // Any edit must be re-reviewed — never let a silently-changed testimonial stay public.
        Status = TestimonialStatus.Pending;
        ShowOnHome = false;
        ShowOnLogin = false;
        ShowOnRegister = false;
    }

    public void Approve() => Status = TestimonialStatus.Approved;

    public void Reject()
    {
        Status = TestimonialStatus.Rejected;
        ShowOnHome = false;
        ShowOnLogin = false;
        ShowOnRegister = false;
    }

    public void SetVisibility(bool showOnHome, bool showOnLogin, bool showOnRegister)
    {
        if (Status != TestimonialStatus.Approved)
            throw new InvalidOperationException("Only an approved testimonial can be shown publicly.");
        ShowOnHome = showOnHome;
        ShowOnLogin = showOnLogin;
        ShowOnRegister = showOnRegister;
    }
}
