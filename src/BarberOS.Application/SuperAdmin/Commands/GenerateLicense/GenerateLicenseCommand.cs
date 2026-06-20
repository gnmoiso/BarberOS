using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.GenerateLicense;

public sealed record GenerateLicenseCommand(
    DateTimeOffset ExpiresAt,
    string? Notes) : ICommand<GenerateLicenseResponse>;

public sealed record GenerateLicenseResponse(Guid Id, string Code, DateTimeOffset ExpiresAt);
