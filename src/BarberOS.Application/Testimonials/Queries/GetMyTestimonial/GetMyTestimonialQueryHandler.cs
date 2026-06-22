using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.Testimonials.Queries.GetMyTestimonial;

internal sealed class GetMyTestimonialQueryHandler(
    ITestimonialRepository testimonials) : ICommandHandler<GetMyTestimonialQuery, MyTestimonialDto?>
{
    public async Task<MyTestimonialDto?> Handle(GetMyTestimonialQuery query, CancellationToken ct)
    {
        var t = await testimonials.FindByTenantAsync(query.TenantId, ct);
        if (t is null) return null;
        return new MyTestimonialDto(t.Id, t.Content, t.AuthorName, t.BarbershipName,
            t.Status.ToString(), t.ShowOnHome, t.ShowOnLogin, t.ShowOnRegister);
    }
}
