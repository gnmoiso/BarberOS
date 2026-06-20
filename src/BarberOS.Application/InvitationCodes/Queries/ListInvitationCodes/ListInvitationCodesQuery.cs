using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.InvitationCodes.Queries.ListInvitationCodes;

public sealed record ListInvitationCodesQuery(Guid TenantId) : ICommand<List<InvitationCodeDto>>;

public sealed record InvitationCodeDto(Guid Id, string Code, string? Label, bool IsActive, int UsageCount);
