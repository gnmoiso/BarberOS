using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.SetTestimonialVisibility;

internal sealed class SetTestimonialVisibilityCommandHandler(
    ITestimonialRepository testimonials,
    IUnitOfWork uow) : ICommandHandler<SetTestimonialVisibilityCommand>
{
    public async Task<Unit> Handle(SetTestimonialVisibilityCommand cmd, CancellationToken ct)
    {
        var t = await testimonials.FindByIdAsync(cmd.TestimonialId, ct)
            ?? throw new NotFoundException("testimonial.not_found", "Testimonio no encontrado.");

        t.SetVisibility(cmd.ShowOnHome, cmd.ShowOnLogin);
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
