import { api } from './api'
import type { Appointment, BookAppointmentRequest, AvailableSlot } from '@/types'

export interface BookingEligibility {
  canBook: boolean
  reason: string | null
  blockingAppointmentId: string | null
  ratingAvailableAt: string | null
  minBookableDate: string
}

export const appointmentsService = {
  /** Barber agenda — bounded to one day. The backend expects `from`/`to`, not `date` (23.13.6). */
  listByDate: (date: string, barberId?: string) => {
    const from = new Date(`${date}T00:00:00`).toISOString()
    const to = new Date(`${date}T23:59:59`).toISOString()
    return api.get<Appointment[]>('/appointments', { params: { from, to, barberId } }).then(r => r.data)
  },

  /** Customer-facing — every one of their own appointments, not bound to a single day. */
  mine: () => api.get<Appointment[]>('/appointments/mine').then(r => r.data),

  bookingEligibility: () => api.get<BookingEligibility>('/appointments/booking-eligibility').then(r => r.data),

  book: (data: BookAppointmentRequest) =>
    api.post<Appointment>('/appointments', data).then(r => r.data),

  cancel: (id: string, reason?: string, cancelledByBarber = false) =>
    api.post(`/appointments/${id}/cancel`, { reason, cancelledByBarber }),

  reschedule: (id: string, startsAt: string) =>
    api.post(`/appointments/${id}/reschedule`, { startsAt }),

  noShow: (id: string) => api.post(`/appointments/${id}/no-show`),
  confirm: (id: string) => api.post(`/appointments/${id}/confirm`),
  start: (id: string) => api.post(`/appointments/${id}/start`),
  complete: (id: string) => api.post(`/appointments/${id}/complete`),

  availableSlots: (barberId: string, date: string, serviceId: string) =>
    api
      .get<AvailableSlot[]>('/appointments/available-slots', {
        params: { barberId, date, serviceId },
      })
      .then(r => r.data),
}
