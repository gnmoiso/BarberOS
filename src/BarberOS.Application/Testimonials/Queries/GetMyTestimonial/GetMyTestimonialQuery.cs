using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Testimonials.Queries.GetMyTestimonial;

public sealed record GetMyTestimonialQuery(Guid TenantId) : ICommand<MyTestimonialDto?>;

public sealed record MyTestimonialDto(
    Guid Id,
    string Content,
    string AuthorName,
    string BarbershipName,
    string Status,
    bool ShowOnHome,
    bool ShowOnLogin,
    bool ShowOnRegister);
