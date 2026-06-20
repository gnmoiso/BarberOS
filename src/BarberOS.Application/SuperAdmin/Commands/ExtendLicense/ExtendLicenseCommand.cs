using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Commands.ExtendLicense;

public sealed record ExtendLicenseCommand(Guid LicenseId, DateTimeOffset NewExpiresAt) : ICommand;
