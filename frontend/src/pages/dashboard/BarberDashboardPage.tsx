import { useState, useEffect } from 'react'
import { Calendar, Star, Clock, DollarSign, Bell, Scissors, Users, Newspaper, UserCheck, Settings, Radio, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications, scheduleAppointmentReminder } from '@/hooks/useNotifications'
import { useRealtimeAppointments, isNotificationSoundEnabled, setNotificationSoundEnabled } from '@/hooks/useRealtimeAppointments'
import { formatCOP } from '@/utils/currency'

interface AppointmentItem {
  id: string
  customerName: string
  serviceName?: string
  servicePrice: number
  startsAt: string
  status: string
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-white text-2xl font-black mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-red-600/40 rounded-2xl p-4 transition-colors">
      <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-red-500" />
      </div>
      <span className="text-xs text-zinc-300 font-medium text-center">{label}</span>
    </Link>
  )
}

export default function BarberDashboardPage() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [rating, setRating] = useState<{ averageStars: number; count: number } | null>(null)
  const [reminderMinutes, setReminderMinutes] = useState(20)
  const [loading, setLoading] = useState(true)
  const [soundOn, setSoundOn] = useState(isNotificationSoundEnabled())
  const [justUpdated, setJustUpdated] = useState(false)

  useEffect(() => { load() }, [])

  useRealtimeAppointments(() => {
    load()
    setJustUpdated(true)
    setTimeout(() => setJustUpdated(false), 4000)
  })

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    setNotificationSoundEnabled(next)
  }

  async function load() {
    setLoading(true)
    try {
      const d = new Date()
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString()
      const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString()

      const [apptRes, ratingRes, settingsRes] = await Promise.allSettled([
        api.get(`/appointments?from=${from}&to=${to}`),
        user?.tenantId ? api.get(`/ratings/barbershop?tenantId=${user.tenantId}`) : Promise.resolve(null),
        api.get('/barbership-settings'),
      ])

      const appts: AppointmentItem[] = apptRes.status === 'fulfilled' ? (apptRes.value.data ?? []) : []
      setAppointments(appts)
      setRating(ratingRes.status === 'fulfilled' && ratingRes.value ? ratingRes.value.data : null)

      const minutesBefore = settingsRes.status === 'fulfilled' && settingsRes.value?.data?.reminderMinutesBeforeAppointment
        ? settingsRes.value.data.reminderMinutesBeforeAppointment : 20
      setReminderMinutes(minutesBefore)

      appts
        .filter(a => a.status === 'Pending' && new Date(a.startsAt) > new Date())
        .forEach(a => scheduleAppointmentReminder(notify, new Date(a.startsAt), a.customerName, minutesBefore))
    } finally {
      setLoading(false)
    }
  }

  const pending = appointments.filter(a => a.status === 'Pending')
  const upcoming = pending.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).slice(0, 5)
  const estimatedIncome = appointments
    .filter(a => a.status !== 'CancelledByCustomer' && a.status !== 'CancelledByBarber')
    .reduce((sum, a) => sum + a.servicePrice, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Hola, {user?.displayName || user?.fullName?.split(' ')[0]}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg" title="Actualización en tiempo real activa">
            <Radio className={`w-3.5 h-3.5 ${justUpdated ? 'animate-pulse' : ''}`} />
            En vivo
          </div>
          <button
            onClick={toggleSound}
            title={soundOn ? 'Silenciar notificaciones' : 'Activar sonido de notificaciones'}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={load} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Citas hoy" value={appointments.length} accent="bg-red-600/10 text-red-500" />
        <StatCard icon={Clock} label="Pendientes" value={pending.length} accent="bg-blue-500/10 text-blue-400" />
        <StatCard icon={DollarSign} label="Ingresos del día" value={`$${formatCOP(estimatedIncome)}`} accent="bg-green-500/10 text-green-400" />
        <StatCard icon={Star} label="Valoración" value={rating?.count ? `${rating.averageStars.toFixed(1)} ★` : '—'} accent="bg-purple-500/10 text-purple-400" />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <QuickLink to="/barberia/appointments" icon={Calendar} label="Citas" />
        <QuickLink to="/barberia/clients" icon={Users} label="Clientes" />
        <QuickLink to="/barberia/barbers" icon={UserCheck} label="Equipo" />
        <QuickLink to="/barberia/posts" icon={Newspaper} label="Novedades" />
        <QuickLink to="/barberia/services" icon={Scissors} label="Servicios" />
        <QuickLink to="/barberia/settings" icon={Settings} label="Ajustes" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-600" />
            Próximas citas de hoy
          </h2>
          <span className="text-xs text-zinc-500">Alertas {reminderMinutes} min antes activas</span>
        </div>

        {!upcoming.length ? (
          <div className="px-6 py-12 text-center text-zinc-600">
            <Scissors className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay citas pendientes para hoy</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {upcoming.map(apt => {
              const time = new Date(apt.startsAt)
              const minutesUntil = Math.round((time.getTime() - Date.now()) / 60000)
              return (
                <div key={apt.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{apt.customerName}</p>
                      <p className="text-zinc-500 text-xs">{apt.serviceName ?? 'Servicio'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">
                      {time.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}
                    </p>
                    {minutesUntil > 0 && minutesUntil <= 60 && (
                      <p className={`text-xs font-medium ${minutesUntil <= reminderMinutes ? 'text-red-500' : 'text-zinc-500'}`}>
                        en {minutesUntil} min
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-red-600" />
            <p className="text-red-400 text-sm">Activa las notificaciones para recibir alertas de citas</p>
          </div>
          <button
            onClick={() => Notification.requestPermission()}
            className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
          >
            Activar
          </button>
        </div>
      )}
    </div>
  )
}
