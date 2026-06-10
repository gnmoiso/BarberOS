namespace BarberOS.Application.Abstractions;

public record AccessTokenResult(string Token, DateTimeOffset ExpiresAt);

public record RefreshTokenResult(string RawToken, string TokenHash, string FamilyId, DateTimeOffset ExpiresAt);

public interface IJwtService
{
    AccessTokenResult GenerateAccessToken(Guid userId, Guid? tenantId, IEnumerable<string> roles);

    /// <summary>Generates a new opaque refresh token, its SHA-256 hash, and a new family id.</summary>
    RefreshTokenResult GenerateRefreshToken();

    /// <summary>Generates a replacement refresh token in the same family (rotation).</summary>
    RefreshTokenResult RotateRefreshToken(string existingFamilyId);

    string HashToken(string rawToken);
}
