import { useEffect, useRef } from 'react'

export function useNotifications() {
  const permissionRef = useRef<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      permissionRef.current = Notification.permission
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => { permissionRef.current = p })
      }
    }
  }, [])

  function notify(title: string, body: string, icon?: string) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    new Notification(title, { body, icon: icon ?? '/favicon.ico', badge: '/favicon.ico' })
  }

  return { notify }
}

export function scheduleAppointmentReminder(
  notify: (title: string, body: string) => void,
  appointmentTime: Date,
  clientName: string,
  minutesBefore = 20
) {
  const now = Date.now()
  const reminderAt = appointmentTime.getTime() - minutesBefore * 60 * 1000
  const delay = reminderAt - now

  if (delay <= 0) return null

  const timerId = setTimeout(() => {
    notify(
      '⏰ Cita próxima — BarberOS',
      `${clientName} llega en ${minutesBefore} minutos`
    )
  }, delay)

  return timerId
}
