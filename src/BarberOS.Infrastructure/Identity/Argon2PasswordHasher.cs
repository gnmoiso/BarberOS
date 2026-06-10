using System.Security.Cryptography;
using System.Text;
using BarberOS.Application.Abstractions;
using Konscious.Security.Cryptography;

namespace BarberOS.Infrastructure.Identity;

/// <summary>
/// Argon2id with OWASP-recommended parameters (docs/05-seguridad.md §1).
/// Memory: 64 MB, iterations: 3, parallelism: 4, hash length: 32 bytes.
/// </summary>
internal sealed class Argon2PasswordHasher : IPasswordHasher
{
    private const int SaltBytes = 16;
    private const int HashBytes = 32;
    private const int Memory = 65536; // 64 MB
    private const int Iterations = 3;
    private const int Parallelism = 4;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        var hash = ComputeHash(password, salt);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;

        var salt = Convert.FromBase64String(parts[0]);
        var expected = Convert.FromBase64String(parts[1]);
        var actual = ComputeHash(password, salt);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static byte[] ComputeHash(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            MemorySize = Memory,
            Iterations = Iterations,
            DegreeOfParallelism = Parallelism,
        };
        return argon2.GetBytes(HashBytes);
    }
}
