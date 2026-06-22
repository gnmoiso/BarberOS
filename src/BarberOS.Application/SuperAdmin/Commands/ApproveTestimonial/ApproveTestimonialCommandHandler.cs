using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.ApproveTestimonial;

internal sealed class ApproveTestimonialCommandHandler(
    ITestimonialRepository testimonials,
    IUnitOfWork uow) : ICommandHandler<ApproveTestimonialCommand>
{
    public async Task<Unit> Handle(ApproveTestimonialCommand cmd, CancellationToken ct)
    {
        var t = await testimonials.FindByIdAsync(cmd.TestimonialId, ct)
            ?? throw new NotFoundException("testimonial.not_found", "Testimonio no encontrado.");

        t.Approve();
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
