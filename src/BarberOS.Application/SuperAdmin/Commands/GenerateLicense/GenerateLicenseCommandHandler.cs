using BarberOS.Application.Abstractions;
using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;
using BarberOS.Domain.Common;
using BarberOS.Domain.Licensing;

namespace BarberOS.Application.SuperAdmin.Commands.GenerateLicense;

internal sealed class GenerateLicenseCommandHandler(
    IBarbershipLicenseRepository licenses,
    IUnitOfWork uow) : ICommandHandler<GenerateLicenseCommand, GenerateLicenseResponse>
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid transcription errors

    public async Task<GenerateLicenseResponse> Handle(GenerateLicenseCommand cmd, CancellationToken ct)
    {
        string code;
        do
        {
            code = GenerateCode();
        } while (await licenses.FindByCodeAsync(code, ct) is not null);

        var license = BarbershipLicense.Create(code, cmd.ExpiresAt, cmd.Notes);
        licenses.Add(license);
        await uow.SaveChangesAsync(ct);

        return new GenerateLicenseResponse(license.Id, license.Code, license.ExpiresAt);
    }

    private static string GenerateCode()
    {
        var chars = new char[10];
        for (var i = 0; i < chars.Length; i++)
            chars[i] = Alphabet[Random.Shared.Next(Alphabet.Length)];
        return $"BOS-{new string(chars, 0, 4)}-{new string(chars, 4, 6)}";
    }
}
