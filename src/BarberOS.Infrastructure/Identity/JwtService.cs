using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BarberOS.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BarberOS.Infrastructure.Identity;

internal sealed class JwtService(IConfiguration configuration, IDateTimeProvider clock) : IJwtService
{
    private readonly string _secret = configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Missing required configuration 'Jwt:Secret'.");

    private readonly int _accessTokenMinutes =
        int.TryParse(configuration["Jwt:AccessTokenMinutes"], out var m) ? m : 15;

    private readonly int _refreshTokenDays =
        int.TryParse(configuration["Jwt:RefreshTokenDays"], out var d) ? d : 30;

    public AccessTokenResult GenerateAccessToken(Guid userId, Guid? tenantId, IEnumerable<string> roles)
    {
        var expiresAt = clock.UtcNow.AddMinutes(_accessTokenMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.CreateVersion7().ToString()),
        };

        if (tenantId.HasValue)
            claims.Add(new Claim("tenant_id", tenantId.Value.ToString()));

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: "barberos-api",
            audience: "barberos-clients",
            claims: claims,
            notBefore: clock.UtcNow.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new AccessTokenResult(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public RefreshTokenResult GenerateRefreshToken()
    {
        var familyId = Guid.CreateVersion7().ToString();
        return BuildRefreshToken(familyId);
    }

    public RefreshTokenResult RotateRefreshToken(string existingFamilyId) =>
        BuildRefreshToken(existingFamilyId);

    public string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private RefreshTokenResult BuildRefreshToken(string familyId)
    {
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var hash = HashToken(raw);
        var expiresAt = clock.UtcNow.AddDays(_refreshTokenDays);
        return new RefreshTokenResult(raw, hash, familyId, expiresAt);
    }
}
