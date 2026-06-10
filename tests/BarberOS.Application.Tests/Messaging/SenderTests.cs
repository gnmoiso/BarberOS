using BarberOS.Application;
using BarberOS.Application.Abstractions.Messaging;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BarberOS.Application.Tests.Messaging;

public class SenderTests
{
    private sealed record Ping(string Message) : ICommand<string>;

    private sealed class PingHandler : ICommandHandler<Ping, string>
    {
        public Task<string> Handle(Ping command, CancellationToken cancellationToken) =>
            Task.FromResult($"pong:{command.Message}");
    }

    [Fact]
    public async Task Send_ResolvesHandlerAndReturnsResponse()
    {
        var services = new ServiceCollection();
        services.AddApplication();
        services.AddScoped<ICommandHandler<Ping, string>, PingHandler>();

        await using var provider = services.BuildServiceProvider();
        var sender = provider.GetRequiredService<ISender>();

        var response = await sender.Send(new Ping("hello"), CancellationToken.None);

        Assert.Equal("pong:hello", response);
    }
}
