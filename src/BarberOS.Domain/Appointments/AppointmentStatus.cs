namespace BarberOS.Domain.Appointments;

public enum AppointmentStatus
{
    Pending = 0,
    Confirmed = 1,
    InProgress = 2,
    Completed = 3,
    CancelledByCustomer = 4,
    CancelledByBarber = 5,
    NoShow = 6,
}
