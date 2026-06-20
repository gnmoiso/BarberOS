using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Auth.Commands.JoinBarbershop;

public sealed record JoinBarbershopCommand(
    Guid UserId,
    string InvitationCode) : ICommand<JoinBarbershopResponse>;

public sealed record JoinBarbershopResponse(
    Guid TenantId,
    string TenantName,
    string TenantSlug,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt);
