using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.Ratings.Queries.GetBarbershopRating;

internal sealed class GetBarbershopRatingQueryHandler(
    IRatingRepository ratings) : ICommandHandler<GetBarbershopRatingQuery, BarbershopRatingDto>
{
    public async Task<BarbershopRatingDto> Handle(GetBarbershopRatingQuery query, CancellationToken ct)
    {
        var avg = await ratings.GetBarbershopAverageStarsAsync(query.TenantId, ct);
        var count = await ratings.GetBarbershopRatingCountAsync(query.TenantId, ct);
        return new BarbershopRatingDto(Math.Round(avg, 1), count);
    }
}
