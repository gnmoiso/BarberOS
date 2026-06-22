using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.ListTestimonials;

public sealed record ListTestimonialsQuery(
    bool? ShowOnHomeOnly = null,
    bool? ShowOnLoginOnly = null,
    bool? ShowOnRegisterOnly = null) : ICommand<List<TestimonialDto>>;

public sealed record TestimonialDto(
    Guid Id,
    Guid TenantId,
    string Content,
    string AuthorName,
    string BarbershipName,
    string Status,
    bool ShowOnHome,
    bool ShowOnLogin,
    bool ShowOnRegister);
