using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using DomainBarbershipSettings = BarberOS.Domain.Barbershop.BarbershipSettings;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;
using BarberOS.Domain.Tenants;

namespace BarberOS.Application.Auth.Commands.RegisterBarber;

internal sealed class RegisterBarberCommandHandler(
    IUserRepository users,
    ITenantRepository tenants,
    IBarbershipSettingsRepository settings,
    IBarberRepository barbers,
    IPasswordHasher hasher,
    IJwtService jwt,
    IUnitOfWork uow) : ICommandHandler<RegisterBarberCommand, RegisterBarberResponse>
{
    public async Task<RegisterBarberResponse> Handle(RegisterBarberCommand cmd, CancellationToken ct)
    {
        PhoneValidation.EnsureValidIfProvided(cmd.Phone);

        var existing = await users.FindByEmailAsync(cmd.Email, ct);
        if (existing is not null)
            throw new ConflictException("auth.email_taken", "Ya existe una cuenta con ese correo.");

        // Tenant is created without a license: the barber must activate one afterwards
        // from the "Contact BarberOS" screen before the full panel unlocks.
        var slug = Tenant.ToSlug(cmd.BarbershopName);
        var tenant = Tenant.Create(cmd.BarbershopName, slug);

        var passwordHash = hasher.Hash(cmd.Password);
        var user = User.Create(cmd.Email, cmd.FullName, passwordHash);
        user.SetPhone(cmd.Phone);
        user.AddTenantRole(tenant.Id, Role.Barber);

        tenants.Add(tenant);
        users.Add(user);

        // Create default barbershop settings
        var barberSettings = DomainBarbershipSettings.CreateDefault(tenant.Id);
        settings.Add(barberSettings);

        // The owner is also a working staff member from day one — without this, BarberId-scoped
        // features (schedule, appointments, rating a customer) could never resolve back to this
        // account, since Barber.Id and User.Id are different entities/ids entirely.
        var ownerBarber = Domain.Staff.Barber.Create(tenant.Id, cmd.FullName, user.Id, cmd.Phone);
        barbers.Add(ownerBarber);

        var accessToken = jwt.GenerateAccessToken(user.Id, tenant.Id, [Role.Barber.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();
        var refreshToken = user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, cmd.IpAddress);
        users.AddRefreshToken(refreshToken);

        await uow.SaveChangesAsync(ct);

        return new RegisterBarberResponse(
            UserId: user.Id,
            TenantId: tenant.Id,
            AccessToken: accessToken.Token,
            RefreshToken: refreshResult.RawToken,
            AccessTokenExpiresAt: accessToken.ExpiresAt,
            FullName: user.FullName,
            Role: Role.Barber.ToString(),
            LicensePending: true);
    }
}
