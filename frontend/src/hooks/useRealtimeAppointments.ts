import { useEffect, useRef } from 'react'
import { getRealtimeConnection } from '@/services/realtime.service'
import { useAuth } from '@/contexts/AuthContext'

const SOUND_PREF_KEY = 'bos_notification_sound'

export function isNotificationSoundEnabled(): boolean {
  return localStorage.getItem(SOUND_PREF_KEY) !== 'off'
}

export function setNotificationSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_PREF_KEY, enabled ? 'on' : 'off')
}

/** Short two-tone chime synthesized with the Web Audio API — no external asset needed. */
function playChime() {
  if (!isNotificationSoundEnabled()) return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const now = ctx.currentTime
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.15, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.25)
    })
  } catch {
    // Web Audio unavailable (e.g. older browser) — fail silently, visual update still happens
  }
}

/**
 * Joins the tenant's SignalR group and calls onEvent for every appointment/rating change,
 * playing a configurable chime so the barber notices without refreshing (23.11.7/23.11.8).
 */
export function useRealtimeAppointments(onEvent: (eventName: string, payload: unknown) => void) {
  const { isAuthenticated, user } = useAuth()
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!isAuthenticated || !user?.tenantId) return

    const connection = getRealtimeConnection()
    const events = ['AppointmentCreated', 'AppointmentCancelled', 'AppointmentRescheduled', 'AppointmentUpdated', 'RatingSubmitted']

    const handlers = events.map(evt => {
      const handler = (payload: unknown) => {
        playChime()
        onEventRef.current(evt, payload)
      }
      connection.on(evt, handler)
      return { evt, handler }
    })

    if (connection.state === 'Disconnected') {
      connection.start().catch(() => {
        // Best-effort: if the hub is unreachable the UI still works via manual refresh
      })
    }

    return () => {
      handlers.forEach(({ evt, handler }) => connection.off(evt, handler))
    }
  }, [isAuthenticated, user?.tenantId])
}

/**
 * Same shared connection, listening for "PostsChanged" — fired after any post/comment/reaction
 * mutation, including platform-wide announcements broadcast to every connection's "all" group
 * (23.12.3/23.12.4/23.12.5). Works for customers too, who have no tenant_id requirement to join.
 */
export function usePostsRealtime(onEvent: () => void) {
  const { isAuthenticated } = useAuth()
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!isAuthenticated) return

    const connection = getRealtimeConnection()
    const handler = () => {
      playChime()
      onEventRef.current()
    }
    connection.on('PostsChanged', handler)

    if (connection.state === 'Disconnected') {
      connection.start().catch(() => {
        // Best-effort: if the hub is unreachable the UI still works via manual refresh
      })
    }

    return () => connection.off('PostsChanged', handler)
  }, [isAuthenticated])
}
