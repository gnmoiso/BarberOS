using System.Reflection;
using BarberOS.Application.Abstractions.Messaging;
using Microsoft.Extensions.DependencyInjection;

namespace BarberOS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ISender, Sender>();
        RegisterHandlers(services, typeof(DependencyInjection).Assembly);
        return services;
    }

    private static void RegisterHandlers(IServiceCollection services, Assembly assembly)
    {
        var handlerInterfaces = new[] { typeof(ICommandHandler<,>), typeof(IQueryHandler<,>) };

        var registrations =
            from type in assembly.GetTypes()
            where type is { IsClass: true, IsAbstract: false }
            from iface in type.GetInterfaces()
            where iface.IsGenericType && handlerInterfaces.Contains(iface.GetGenericTypeDefinition())
            select (Service: iface, Implementation: type);

        foreach (var (service, implementation) in registrations)
        {
            services.AddScoped(service, implementation);
        }
    }
}
