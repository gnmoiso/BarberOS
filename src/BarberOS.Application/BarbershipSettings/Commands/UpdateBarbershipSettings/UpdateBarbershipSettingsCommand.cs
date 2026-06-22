using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.BarbershipSettings.Commands.UpdateBarbershipSettings;

public sealed record UpdateBarbershipSettingsCommand(
    Guid TenantId,
    int DaysAheadNormalUser,
    decimal BasePriceNoService,
    string Currency,
    decimal? BeardPrice,
    decimal? EyebrowPrice,
    decimal? WashPrice,
    string? Address,
    string? OwnerName,
    int? ReminderMinutesBeforeAppointment,
    int? MinLeadMinutes = null) : ICommand;
