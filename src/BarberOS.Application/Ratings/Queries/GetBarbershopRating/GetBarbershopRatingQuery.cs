using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.Ratings.Queries.GetBarbershopRating;

public sealed record GetBarbershopRatingQuery(Guid TenantId) : ICommand<BarbershopRatingDto>;

public sealed record BarbershopRatingDto(double AverageStars, int Count);
