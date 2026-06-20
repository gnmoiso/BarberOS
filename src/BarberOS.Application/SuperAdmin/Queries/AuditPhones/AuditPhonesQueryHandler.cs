using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Abstractions.Repositories;

namespace BarberOS.Application.SuperAdmin.Queries.AuditPhones;

internal sealed class AuditPhonesQueryHandler(
    IUserRepository users,
    IBarberRepository barbers,
    ICustomerRepository customers) : IQueryHandler<AuditPhonesQuery, PhoneAuditReport>
{
    public async Task<PhoneAuditReport> Handle(AuditPhonesQuery query, CancellationToken ct)
    {
        var userPhones = await users.ListAllPhonesAsync(ct);
        var barberPhones = await barbers.ListAllPhonesAsync(ct);
        var customerPhones = await customers.ListAllPhonesAsync(ct);

        return new PhoneAuditReport(
            Summarize(userPhones),
            Summarize(barberPhones),
            Summarize(customerPhones!));
    }

    private static PhoneAuditCounts Summarize(IEnumerable<string?> phones)
    {
        var list = phones.ToList();
        int empty = 0, tooShort = 0, tooLong = 0, invalidChars = 0, valid = 0;

        foreach (var phone in list)
        {
            if (string.IsNullOrWhiteSpace(phone)) { empty++; continue; }
            // System-generated placeholders for phoneless members (see JoinBarbershopCommandHandler /
            // BookAppointmentCommandHandler) are not real phones — count them as "empty", not "invalid".
            if (phone.StartsWith("sin-tel-")) { empty++; continue; }
            if (!phone.All(char.IsDigit)) { invalidChars++; continue; }
            if (phone.Length < 10) { tooShort++; continue; }
            if (phone.Length > 10) { tooLong++; continue; }
            valid++;
        }

        return new PhoneAuditCounts(list.Count, empty, tooShort, tooLong, invalidChars, valid);
    }
}
