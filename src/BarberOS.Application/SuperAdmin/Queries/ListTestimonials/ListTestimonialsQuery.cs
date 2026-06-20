using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.ListTestimonials;

public sealed record ListTestimonialsQuery(bool? ShowOnHomeOnly = null, bool? ShowOnLoginOnly = null)
    : ICommand<List<TestimonialDto>>;

public sealed record TestimonialDto(
    Guid Id,
    Guid TenantId,
    string Content,
    string AuthorName,
    string BarbershipName,
    bool ShowOnHome,
    bool ShowOnLogin);
