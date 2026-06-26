import { useState, useEffect } from 'react'
import { Calendar, Star, CheckCircle2, XCircle, Building2, Newspaper, KeyRound, Clock, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/auth.service'
import { useRealtimeAppointments, usePostsRealtime } from '@/hooks/useRealtimeAppointments'
import { StatCard } from '@/components/ui/StatCard'
import type { MyTenant } from '@/types'

interface AppointmentItem {
  id: string
  barberName: string
  serviceName?: string
  startsAt: string
  status: string
  isRated: boolean
  canRate?: boolean
}

function RatingModal({ appointment, onClose, onRated }: { appointment: AppointmentItem; onClose: () => void; onRated: () => void }) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (stars === 0) return
    setSaving(true)
    try {
      await api.post('/ratings/service', { appointmentId: appointment.id, stars, comment: comment || null })
      onRated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Califica tu servicio</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-zinc-400 text-sm">{appointment.serviceName} con {appointment.barberName}</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setStars(n)}>
              <Star className={`w-8 h-8 ${n <= stars ? 'text-red-500 fill-red-500' : 'text-zinc-700'}`} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Comentario (opcional)"
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
        />
        <button
          onClick={submit}
          disabled={stars === 0 || saving}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Enviando...' : 'Enviar calificación'}
        </button>
      </div>
    </div>
  )
}

export default function CustomerDashboardPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [tenants, setTenants] = useState<MyTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingTarget, setRatingTarget] = useState<AppointmentItem | null>(null)

  useEffect(() => { load() }, [])

  // 23.12.12 — the customer dashboard now reflects new/cancelled/rescheduled appointments and
  // ratings live, plus new posts/comments, without changing pages or refreshing. Uses the silent
  // `refresh` (no loading-spinner flash) so a background push doesn't reset scroll position.
  useRealtimeAppointments(() => refresh())
  usePostsRealtime(() => refresh())

  async function load() {
    setLoading(true)
    try {
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    const from = new Date(2020, 0, 1).toISOString()
    const to = new Date(2030, 0, 1).toISOString()
    const [apptRes, tenantsRes] = await Promise.allSettled([
      api.get(`/appointments?from=${from}&to=${to}`),
      authService.myTenants(),
    ])
    setAppointments(apptRes.status === 'fulfilled' ? (apptRes.value.data ?? []) : [])
    setTenants(tenantsRes.status === 'fulfilled' ? tenantsRes.value : [])
  }

  const now = new Date()
  const upcoming = appointments
    .filter(a => a.status === 'Pending' && new Date(a.startsAt) > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const nextAppointment = upcoming[0]

  const attended = appointments.filter(a => a.status === 'Completed').length
  const missed = appointments.filter(a => a.status === 'NoShow').length
  // canRate opens an hour after the appointment's scheduled start regardless of whether the
  // barber ever marked it Confirmed/InProgress/Completed — busy barbers often don't.
  const pendingRating = appointments.filter(a => a.canRate && !a.isRated)

  const history = appointments
    .filter(a => a.status === 'Completed' || a.status === 'NoShow' || a.status.startsWith('Cancelled') || a.canRate)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, 8)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Hola, {user?.displayName || user?.fullName?.split(' ')[0]}</h1>
        <p className="text-zinc-400 text-sm mt-1">Tu actividad en {tenants.length} barbería{tenants.length !== 1 ? 's' : ''}</p>
      </div>

      {pendingRating.length > 0 && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-2xl px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-300 text-sm">Tienes {pendingRating.length} servicio{pendingRating.length !== 1 ? 's' : ''} sin calificar</p>
          </div>
          <button
            onClick={() => setRatingTarget(pendingRating[0])}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            Calificar ahora
          </button>
        </div>
      )}

      {/* Próxima cita — destacada */}
      {nextAppointment ? (
        <div className="bg-gradient-to-br from-red-700/20 via-zinc-900 to-blue-700/20 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-2">Tu próxima cita</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white text-xl font-black">{nextAppointment.serviceName ?? 'Servicio'}</p>
              <p className="text-zinc-400 text-sm mt-1">con {nextAppointment.barberName}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">
                {new Date(nextAppointment.startsAt).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-red-400 text-sm font-medium">
                {new Date(nextAppointment.startsAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-zinc-700" />
            <p className="text-zinc-400 text-sm">No tienes citas próximas</p>
          </div>
          <Link to="/user/appointments" className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
            Reservar cita
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard icon={CheckCircle2} label="Asistidas" value={attended} accent="bg-green-500/10 text-green-400" />
        <StatCard icon={XCircle} label="Perdidas" value={missed} accent="bg-orange-500/10 text-orange-400" />
        <StatCard icon={Building2} label="Barberías" value={tenants.length} accent="bg-blue-500/10 text-blue-400" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/user/appointments" className="flex flex-col items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-red-600/40 rounded-2xl p-4 transition-colors">
          <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-red-500" /></div>
          <span className="text-xs text-zinc-300 font-medium">Reservar cita</span>
        </Link>
        <Link to="/user/posts" className="flex flex-col items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-blue-600/40 rounded-2xl p-4 transition-colors">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center"><Newspaper className="w-5 h-5 text-blue-400" /></div>
          <span className="text-xs text-zinc-300 font-medium">Novedades</span>
        </Link>
        <Link to="/user/barbershop-code" className="flex flex-col items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-red-600/40 rounded-2xl p-4 transition-colors">
          <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center"><KeyRound className="w-5 h-5 text-red-500" /></div>
          <span className="text-xs text-zinc-300 font-medium">Unirme a barbería</span>
        </Link>
        <Link to="/user/profile" className="flex flex-col items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-blue-600/40 rounded-2xl p-4 transition-colors">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center"><Star className="w-5 h-5 text-blue-400" /></div>
          <span className="text-xs text-zinc-300 font-medium">Mi perfil</span>
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            Historial reciente
          </h2>
        </div>
        {history.length === 0 ? (
          <div className="px-6 py-10 text-center text-zinc-600">
            <p>Aún no tienes citas en tu historial</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {history.map(a => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold text-sm">{a.serviceName ?? 'Servicio'}</p>
                  <p className="text-zinc-500 text-xs">con {a.barberName} · {new Date(a.startsAt).toLocaleDateString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.canRate && !a.isRated && (
                    <button
                      onClick={() => setRatingTarget(a)}
                      className="text-xs bg-red-600/15 text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-600/25 transition-colors"
                    >
                      Calificar
                    </button>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-lg ${
                    a.status === 'NoShow' ? 'bg-orange-500/15 text-orange-400'
                    : a.status.startsWith('Cancelled') ? 'bg-zinc-800 text-zinc-500'
                    : 'bg-green-500/15 text-green-400'
                  }`}>
                    {a.status === 'NoShow' ? 'No asistió' : a.status.startsWith('Cancelled') ? 'Cancelada' : 'Asistió'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ratingTarget && (
        <RatingModal
          appointment={ratingTarget}
          onClose={() => setRatingTarget(null)}
          onRated={() => { setRatingTarget(null); refresh() }}
        />
      )}
    </div>
  )
}
