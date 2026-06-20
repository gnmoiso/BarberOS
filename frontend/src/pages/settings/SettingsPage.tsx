import { useState, useEffect } from 'react'
import { Settings, MapPin, User, DollarSign, CalendarClock, Bell } from 'lucide-react'
import { api } from '@/services/api'

interface BarbershipSettings {
  daysAheadNormalUser: number
  basePriceNoService: number
  currency: string
  beardPrice?: number
  eyebrowPrice?: number
  washPrice?: number
  address?: string
  ownerName?: string
  reminderMinutesBeforeAppointment: number
}

const empty: BarbershipSettings = {
  daysAheadNormalUser: 0,
  basePriceNoService: 0,
  currency: 'COP',
  reminderMinutesBeforeAppointment: 20,
}

export default function SettingsPage() {
  const [form, setForm] = useState<BarbershipSettings>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)

  useEffect(() => {
    api.get('/barbership-settings').then(r => {
      if (r.data) setForm(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      await api.put('/barbership-settings', form)
      setMsg({ text: 'Ajustes guardados', error: false })
    } catch {
      setMsg({ text: 'Error al guardar', error: true })
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof BarbershipSettings>(key: K) => (v: BarbershipSettings[K]) =>
    setForm(f => ({ ...f, [key]: v }))

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Ajustes de la barbería</h1>
        <p className="text-zinc-400 text-sm mt-1">Configura precios, anticipación de reservas y datos del negocio</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-red-600" /> Información del negocio
          </h2>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Nombre del dueño</label>
            <input
              type="text"
              value={form.ownerName ?? ''}
              onChange={e => set('ownerName')(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Dirección
            </label>
            <input
              type="text"
              value={form.address ?? ''}
              onChange={e => set('address')(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
              placeholder="Dirección de la barbería"
            />
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-red-600" /> Anticipación de reservas
          </h2>
          <p className="text-zinc-500 text-xs">
            Días de anticipación mínima para clientes normales. Los clientes preferidos (con estrella) pueden reservar desde el día siguiente.
          </p>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Días de anticipación</label>
            <input
              type="number"
              min={0}
              value={form.daysAheadNormalUser}
              onChange={e => set('daysAheadNormalUser')(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
            />
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" /> Notificaciones
          </h2>
          <p className="text-zinc-500 text-xs">
            Cuántos minutos antes de cada cita quieres recibir la alerta de recordatorio en tu panel.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={1440}
              value={form.reminderMinutesBeforeAppointment}
              onChange={e => set('reminderMinutesBeforeAppointment')(parseInt(e.target.value, 10) || 1)}
              className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-zinc-400 text-sm">minutos antes</span>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red-600" /> Precios
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Precio base (sin servicio)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.basePriceNoService}
                onChange={e => set('basePriceNoService')(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Moneda</label>
              <input
                type="text"
                value={form.currency}
                onChange={e => set('currency')(e.target.value.toUpperCase())}
                maxLength={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Barba (opcional)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.beardPrice ?? ''}
                onChange={e => set('beardPrice')(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
                placeholder="Sin costo adicional"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Cejas (opcional)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.eyebrowPrice ?? ''}
                onChange={e => set('eyebrowPrice')(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
                placeholder="Sin costo adicional"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Lavado (opcional)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.washPrice ?? ''}
                onChange={e => set('washPrice')(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
                placeholder="Sin costo adicional"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar ajustes'}
          </button>
          {msg && <span className={`text-sm ${msg.error ? 'text-red-500' : 'text-green-400'}`}>{msg.text}</span>}
        </div>
      </form>
    </div>
  )
}
