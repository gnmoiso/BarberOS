using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Catalog.Commands.CreateService;

namespace BarberOS.Application.Catalog.Queries.ListServices;

public sealed record ListServicesQuery : IQuery<IReadOnlyList<ServiceResponse>>;
