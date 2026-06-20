using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.BarbershipSettings.Queries.GetBarbershipSettings;

public sealed record GetBarbershipSettingsQuery(Guid TenantId) : ICommand<BarbershipSettingsDto?>;

public sealed record BarbershipSettingsDto(
    int DaysAheadNormalUser,
    decimal BasePriceNoService,
    string Currency,
    decimal? BeardPrice,
    decimal? EyebrowPrice,
    decimal? WashPrice,
    string? Address,
    string? OwnerName,
    int ReminderMinutesBeforeAppointment);
