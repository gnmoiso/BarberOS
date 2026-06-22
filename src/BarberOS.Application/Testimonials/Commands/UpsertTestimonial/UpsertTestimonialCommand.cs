using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Testimonials.Commands.UpsertTestimonial;

/// <summary>Max one testimonial per barbershop (23.20.11) — create on first call, update + reset
/// to Pending on every subsequent call.</summary>
public sealed record UpsertTestimonialCommand(
    Guid TenantId,
    string Content,
    string AuthorName,
    string BarbershipName) : ICommand;
