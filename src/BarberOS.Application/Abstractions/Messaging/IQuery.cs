namespace BarberOS.Application.Abstractions.Messaging;

/// <summary>CQRS read request. Queries may bypass the domain and read projections directly.</summary>
public interface IQuery<TResponse>;

public interface IQueryHandler<in TQuery, TResponse>
    where TQuery : IQuery<TResponse>
{
    Task<TResponse> Handle(TQuery query, CancellationToken cancellationToken);
}
