using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.InvitationCodes.Queries.ListInvitationCodes;

internal sealed class ListInvitationCodesQueryHandler(
    IInvitationCodeRepository codes) : ICommandHandler<ListInvitationCodesQuery, List<InvitationCodeDto>>
{
    public async Task<List<InvitationCodeDto>> Handle(ListInvitationCodesQuery query, CancellationToken ct)
    {
        var all = await codes.ListByTenantAsync(query.TenantId, ct);
        return all.Select(c => new InvitationCodeDto(c.Id, c.Code, c.Label, c.IsActive, c.UsageCount)).ToList();
    }
}
