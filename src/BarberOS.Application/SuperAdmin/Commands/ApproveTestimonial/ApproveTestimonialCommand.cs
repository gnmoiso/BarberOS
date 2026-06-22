using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.ApproveTestimonial;

public sealed record ApproveTestimonialCommand(Guid TestimonialId) : ICommand;
