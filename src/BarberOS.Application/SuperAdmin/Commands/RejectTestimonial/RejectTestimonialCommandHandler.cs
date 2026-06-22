using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;

namespace BarberOS.Application.SuperAdmin.Commands.RejectTestimonial;

internal sealed class RejectTestimonialCommandHandler(
    ITestimonialRepository testimonials,
    IUnitOfWork uow) : ICommandHandler<RejectTestimonialCommand>
{
    public async Task<Unit> Handle(RejectTestimonialCommand cmd, CancellationToken ct)
    {
        var t = await testimonials.FindByIdAsync(cmd.TestimonialId, ct)
            ?? throw new NotFoundException("testimonial.not_found", "Testimonio no encontrado.");

        t.Reject();
        await uow.SaveChangesAsync(ct);
        return default;
    }
}
