using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.RejectTestimonial;

public sealed record RejectTestimonialCommand(Guid TestimonialId) : ICommand;
