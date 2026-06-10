using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BarberOS.Api.IntegrationTests;

public class HealthChecksTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public HealthChecksTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task HealthLive_Returns200_WithoutTouchingDependencies()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health/live");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task AnyResponse_EchoesCorrelationAndRequestIds()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Correlation-Id", "test-correlation-123");

        var response = await client.GetAsync("/health/live");

        Assert.Equal("test-correlation-123", Assert.Single(response.Headers.GetValues("X-Correlation-Id")));
        Assert.True(response.Headers.Contains("X-Request-Id"));
    }
}

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        // Real PostgreSQL (Testcontainers) arrives with the first persisted module;
        // the connection string only needs to be present for startup validation here.
        builder.UseSetting("ConnectionStrings:Database",
            "Host=localhost;Port=5432;Database=barberos_test;Username=test;Password=test");
        builder.UseEnvironment("Testing");
    }
}
