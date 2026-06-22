using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Barbershop;

namespace BarberOS.Application.Testimonials.Commands.UpsertTestimonial;

internal sealed class UpsertTestimonialCommandHandler(
    ITestimonialRepository testimonials,
    IUnitOfWork uow) : ICommandHandler<UpsertTestimonialCommand>
{
    public async Task<Unit> Handle(UpsertTestimonialCommand cmd, CancellationToken ct)
    {
        var existing = await testimonials.FindByTenantAsync(cmd.TenantId, ct);
        if (existing is null)
        {
            var created = Testimonial.Create(cmd.TenantId, cmd.Content, cmd.AuthorName, cmd.BarbershipName);
            testimonials.Add(created);
        }
        else
        {
            existing.Update(cmd.Content, cmd.AuthorName, cmd.BarbershipName);
        }

        await uow.SaveChangesAsync(ct);
        return default;
    }
}
