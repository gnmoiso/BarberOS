using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.SuperAdmin.Queries.ListTestimonials;

internal sealed class ListTestimonialsQueryHandler(
    ITestimonialRepository testimonials) : ICommandHandler<ListTestimonialsQuery, List<TestimonialDto>>
{
    public async Task<List<TestimonialDto>> Handle(ListTestimonialsQuery query, CancellationToken ct)
    {
        var all = query.ShowOnHomeOnly == true
            ? await testimonials.ListApprovedForHomeAsync(ct)
            : query.ShowOnLoginOnly == true
                ? await testimonials.ListApprovedForLoginAsync(ct)
                : await testimonials.ListAllAsync(ct);

        return all.Select(t => new TestimonialDto(
            t.Id, t.TenantId, t.Content, t.AuthorName, t.BarbershipName,
            t.ShowOnHome, t.ShowOnLogin)).ToList();
    }
}
