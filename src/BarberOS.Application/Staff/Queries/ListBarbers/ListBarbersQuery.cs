using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Staff.Commands.CreateBarber;

namespace BarberOS.Application.Staff.Queries.ListBarbers;

public sealed record ListBarbersQuery : IQuery<IReadOnlyList<BarberResponse>>;
