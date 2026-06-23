using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Auth.Commands.JoinBarbershop;

/// <summary>
/// Joins a barbershop via the invitation code's opaque id (the QR/deep-link flow)
/// instead of the human-typed code text, so the code itself never appears in a URL.
/// </summary>
public sealed record JoinBarbershopByTokenCommand(
    Guid UserId,
    Guid CodeId) : ICommand<JoinBarbershopResponse>;
