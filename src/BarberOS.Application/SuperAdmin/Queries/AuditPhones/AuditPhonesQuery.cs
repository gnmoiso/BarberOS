using BarberOS.Application.Abstractions.Messaging;

namespace BarberOS.Application.SuperAdmin.Queries.AuditPhones;

/// <summary>23.17.5 — one-time/repeatable diagnostic over existing phone data, run before the
/// 10-digit rule existed, to know how many records actually need fixing.</summary>
public sealed record AuditPhonesQuery : IQuery<PhoneAuditReport>;

public sealed record PhoneAuditCounts(int Total, int Empty, int TooShort, int TooLong, int InvalidChars, int Valid);

public sealed record PhoneAuditReport(
    PhoneAuditCounts Users,
    PhoneAuditCounts Barbers,
    PhoneAuditCounts Customers);
