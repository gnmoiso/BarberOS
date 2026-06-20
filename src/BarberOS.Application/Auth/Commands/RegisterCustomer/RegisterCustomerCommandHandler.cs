using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Identity;

namespace BarberOS.Application.Auth.Commands.RegisterCustomer;

internal sealed class RegisterCustomerCommandHandler(
    IUserRepository users,
    IPasswordHasher hasher,
    IJwtService jwt,
    IUnitOfWork uow) : ICommandHandler<RegisterCustomerCommand, RegisterCustomerResponse>
{
    public async Task<RegisterCustomerResponse> Handle(RegisterCustomerCommand cmd, CancellationToken ct)
    {
        PhoneValidation.EnsureValidIfProvided(cmd.Phone);

        var existing = await users.FindByEmailAsync(cmd.Email, ct);
        if (existing is not null)
            throw new ConflictException("auth.email_taken", "Ya existe una cuenta con ese correo.");

        var passwordHash = hasher.Hash(cmd.Password);
        var user = User.Create(cmd.Email, cmd.FullName, passwordHash);
        user.SetPhone(cmd.Phone);

        users.Add(user);

        // Customer has no tenant yet — they join via invitation code after login
        var accessToken = jwt.GenerateAccessToken(user.Id, null, [Role.Customer.ToString()]);
        var refreshResult = jwt.GenerateRefreshToken();
        var refreshToken = user.IssueRefreshToken(refreshResult.TokenHash, refreshResult.FamilyId, refreshResult.ExpiresAt, cmd.IpAddress);
        users.AddRefreshToken(refreshToken);

        await uow.SaveChangesAsync(ct);

        return new RegisterCustomerResponse(
            UserId: user.Id,
            AccessToken: accessToken.Token,
            RefreshToken: refreshResult.RawToken,
            AccessTokenExpiresAt: accessToken.ExpiresAt,
            FullName: user.FullName,
            Role: Role.Customer.ToString());
    }
}
