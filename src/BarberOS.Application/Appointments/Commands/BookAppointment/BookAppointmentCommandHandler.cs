using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Application.Appointments;
using BarberOS.Domain.Appointments;
using BarberOS.Domain.Common;
using BarberOS.Domain.Customers;

namespace BarberOS.Application.Appointments.Commands.BookAppointment;

internal sealed class BookAppointmentCommandHandler(
    IAppointmentRepository appointments,
    ICustomerRepository customers,
    IBarberRepository barbers,
    IServiceRepository services,
    IUserRepository users,
    IRatingRepository ratings,
    IBarbershipSettingsRepository settings,
    ITenantRepository tenants,
    ITenantProvider tenantProvider,
    IUnitOfWork uow) : ICommandHandler<BookAppointmentCommand, AppointmentResponse>
{
    public async Task<AppointmentResponse> Handle(BookAppointmentCommand cmd, CancellationToken ct)
    {
        var tenantId = tenantProvider.TenantId!.Value;

        var targetUserId = cmd.CustomerUserId ?? cmd.CallerUserId;
        var customer = await ResolveCustomerByUserIdAsync(tenantId, targetUserId, ct);

        if (customer.IsBlocked(DateTimeOffset.UtcNow))
            throw new ForbiddenException("CUSTOMER_BLOCKED", "This customer is blocked from booking.");

        // 23.15.1/23.15.2 — backend-enforced advance-booking window, never trusting the frontend's
        // date picker. Only applies to customer self-service bookings; a barber booking on behalf
        // of a walk-in client (cmd.CustomerUserId set) is exempt.
        if (cmd.CustomerUserId is null)
            await EnsureWithinBookingWindowAsync(tenantId, cmd.CallerUserId, cmd.StartsAt, ct);

        // 23.19 — a slot that already started, or that doesn't leave the barbershop's configured
        // minimum lead time, can never be booked — for anyone, customer or barber-assisted.
        await EnsureNotPastOrTooSoonAsync(tenantId, cmd.StartsAt, ct);

        // 23.13.1/23.13.2/23.13.8/23.16.4/23.16.5 — a customer may only have ONE active appointment
        // across EVERY barbershop they belong to (not just this one), and must rate every completed
        // service before booking another, anywhere. Checked across all of the user's CRM Customer
        // records, not just this tenant's — the frontend gate is advisory only, this is the real
        // validation, and it can never be bypassed by simply switching the active barbershop.
        await EnsureCustomerIsEligibleToBookAsync(targetUserId, ct);

        var barber = await barbers.FindByIdAsync(cmd.BarberId, ct)
            ?? throw new NotFoundException("BARBER_NOT_FOUND", $"Barber {cmd.BarberId} not found.");

        var service = await services.FindByIdAsync(cmd.ServiceId, ct)
            ?? throw new NotFoundException("SERVICE_NOT_FOUND", $"Service {cmd.ServiceId} not found.");

        if (!service.IsActive)
            throw new ConflictException("SERVICE_INACTIVE", "The selected service is not active.");

        var endsAt = cmd.StartsAt.AddMinutes(service.DurationMinutes);

        var hasConflict = await appointments.HasConflictAsync(tenantId, cmd.BarberId, cmd.StartsAt, endsAt, null, ct);
        if (hasConflict)
            throw new ConflictException("SLOT_CONFLICT", "The selected time slot is not available.");

        var appointment = Appointment.Book(
            tenantId, customer.Id, cmd.BarberId, cmd.ServiceId,
            service.Name, service.Price, service.DurationMinutes,
            cmd.StartsAt, cmd.Notes);

        appointments.Add(appointment);

        // 23.13.5 — extras (Barba/Cejas/Lavado, etc.) are persisted as structured rows tied to this
        // appointment, not encoded into the free-text Notes field, so totals can be queried/audited later.
        foreach (var addOn in cmd.AddOns ?? [])
            appointments.AddAddOn(appointment.AddAddOn(addOn.Name, addOn.Price));

        await uow.SaveChangesAsync(ct);

        return ToResponse(appointment, customer.FullName, barber.DisplayName);
    }

    private async Task EnsureWithinBookingWindowAsync(Guid tenantId, Guid callerUserId, DateTimeOffset startsAt, CancellationToken ct)
    {
        var tenant = await tenants.FindByIdAsync(tenantId, ct);
        var timeZone = ResolveTimeZone(tenant?.Timezone);

        var tenantSettings = await settings.GetByTenantAsync(tenantId, ct);
        var daysAhead = tenantSettings?.DaysAheadNormalUser ?? 0;
        var isPreferred = await users.IsPreferredCustomerAsync(tenantId, callerUserId, ct);

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, timeZone).DateTime);
        var minDate = BookingWindowPolicy.MinBookableDate(today, daysAhead, isPreferred);
        var requestedDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(startsAt, timeZone).DateTime);

        if (requestedDate < minDate)
            throw new ConflictException("BOOKING_WINDOW_VIOLATION",
                $"Esta barbería requiere reservar con al menos {daysAhead} día(s) de anticipación. Primera fecha disponible: {minDate:dd/MM/yyyy}.");
    }

    private async Task EnsureNotPastOrTooSoonAsync(Guid tenantId, DateTimeOffset startsAt, CancellationToken ct)
    {
        var tenantSettings = await settings.GetByTenantAsync(tenantId, ct);
        var minLeadMinutes = tenantSettings?.MinLeadMinutes ?? 30;
        var earliestStart = DateTimeOffset.UtcNow.AddMinutes(minLeadMinutes);

        if (startsAt < earliestStart)
            throw new ValidationException("BOOKING_TIME_PASSED", "No puedes reservar una cita en un horario que ya ha pasado.");
    }

    private static TimeZoneInfo ResolveTimeZone(string? ianaId)
    {
        if (string.IsNullOrWhiteSpace(ianaId)) return TimeZoneInfo.Utc;
        try { return TimeZoneInfo.FindSystemTimeZoneById(ianaId); }
        catch (TimeZoneNotFoundException) { return TimeZoneInfo.CreateCustomTimeZone("Fallback-CO", TimeSpan.FromHours(-5), "Colombia (fallback)", "Colombia (fallback)"); }
    }

    private async Task EnsureCustomerIsEligibleToBookAsync(Guid targetUserId, CancellationToken ct)
    {
        const string blockMessage = "Tienes una cita activa o una calificación pendiente. Debes finalizarla antes de reservar una nueva cita.";

        var customerIds = (await customers.ListByUserIdAcrossTenantsAsync(targetUserId, ct)).Select(c => c.Id).ToList();
        if (customerIds.Count == 0) return;

        var history = await appointments.ListByCustomerIdsAsync(customerIds, page: 1, size: 200, ct);

        var hasActive = history.Any(a => a.Status is AppointmentStatus.Pending or AppointmentStatus.Confirmed);
        if (hasActive)
            throw new ConflictException("CUSTOMER_HAS_ACTIVE_APPOINTMENT", blockMessage);

        foreach (var completed in history.Where(a => a.Status == AppointmentStatus.Completed))
        {
            var rated = await ratings.FindServiceRatingByAppointmentAsync(completed.Id, ct) is not null;
            if (!rated)
                throw new ConflictException("CUSTOMER_HAS_UNRATED_APPOINTMENT", blockMessage);
        }
    }

    /// <summary>
    /// Real tenant members (joined via invitation code) have no guaranteed row in the legacy CRM "Customer"
    /// table until their first booking — find it, or lazily create it from the User record, keyed by UserId.
    /// This is what makes every actual member bookable by a barber, not just ones who self-booked before.
    /// </summary>
    private async Task<Customer> ResolveCustomerByUserIdAsync(Guid tenantId, Guid targetUserId, CancellationToken ct)
    {
        var existing = await customers.FindByUserIdAsync(tenantId, targetUserId, ct);
        if (existing is not null) return existing;

        var user = await users.FindByIdWithRolesAsync(targetUserId, ct)
            ?? throw new NotFoundException("USER_NOT_FOUND", $"User {targetUserId} not found.");

        // Same fix as JoinBarbershopCommandHandler — the shared literal "Sin teléfono" violated the
        // unique (TenantId, Phone) index for the second phoneless customer in the same barbershop.
        var phone = user.Phone ?? $"sin-tel-{user.Id:N}"[..30];
        var created = Customer.Create(tenantId, user.FullName, phone, user.Email, user.Id);
        customers.Add(created);
        return created;
    }

    internal static AppointmentResponse ToResponse(Appointment a, string customerName, string barberName, bool isRated = false, string? tenantName = null)
    {
        var addOns = a.AddOns.Select(ao => new AppointmentAddOnResponse(ao.Name, ao.Price)).ToList();
        var totalPrice = a.ServicePrice + addOns.Sum(ao => ao.Price);

        return new(a.Id, a.CustomerId, customerName, a.BarberId, barberName, a.ServiceId,
            a.ServiceName, a.ServicePrice, a.ServiceDurationMinutes,
            a.StartsAt, a.EndsAt, a.Status.ToString(), a.Notes, a.PenaltyAmount, isRated,
            addOns, totalPrice, a.TenantId, tenantName);
    }
}
