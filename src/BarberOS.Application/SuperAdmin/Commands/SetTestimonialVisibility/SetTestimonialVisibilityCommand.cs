using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.SetTestimonialVisibility;

public sealed record SetTestimonialVisibilityCommand(
    Guid TestimonialId,
    bool ShowOnHome,
    bool ShowOnLogin) : ICommand;
