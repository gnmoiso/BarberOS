import { useState, useEffect, useRef } from 'react'
import { Settings, MapPin, User, DollarSign, CalendarClock, Bell, Image as ImageIcon, Loader2, Scissors, X, Quote } from 'lucide-react'
import { api } from '@/services/api'
import { uploadsService } from '@/services/uploads.service'
import { notifyBrandLogoUpdated } from '@/hooks/useBrandLogo'
import { BackButton } from '@/components/shared/BackButton'

interface MyTestimonial {
  id: string
  content: string
  authorName: string
  barbershipName: string
  status: 'Pending' | 'Approved' | 'Rejected'
  showOnHome: boolean
  showOnLogin: boolean
  showOnRegister: boolean
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  Pending: { label: 'Pendiente de revisión', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  Approved: { label: 'Aprobado', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  Rejected: { label: 'Rechazado', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

interface BarbershipSettings {
  // Left `undefined`-able so the inputs can be fully cleared mid-edit instead of
  // snapping back to a literal 0/20 the moment the field is empty; save() fills in
  // the real defaults if the user leaves one blank.
  daysAheadNormalUser: number | undefined
  basePriceNoService: number | undefined
  currency: string
  beardPrice?: number
  eyebrowPrice?: number
  washPrice?: number
  address?: string
  ownerName?: string
  reminderMinutesBeforeAppointment: number | undefined
  minLeadMinutes: number
  logoUrl?: string | null
}

const empty: BarbershipSettings = {
  daysAheadNormalUser: 0,
  basePriceNoService: 0,
  currency: 'COP',
  reminderMinutesBeforeAppointment: 20,
  minLeadMinutes: 30,
}

function NumField({ value, onValueChange, allowDecimal = true, className = '', ...props }: {
  value: number | undefined
  onValueChange: (v: number | undefined) => void
  allowDecimal?: boolean
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [text, setText] = useState(value === undefined ? '' : String(value))

  useEffect(() => { setText(value === undefined ? '' : String(value)) }, [value])

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={text}
      onChange={e => {
        const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g
        const raw = e.target.value.replace(pattern, '')
        setText(raw)
        onValueChange(raw === '' || raw === '.' ? undefined : Number(raw))
      }}
      className={`bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 ${className}`}
      {...props}
    />
  )
}

export default function SettingsPage() {
  const [form, setForm] = useState<BarbershipSettings>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // 23.20.11 — "Mi Testimonio": un testimonio por barbería, editable, que vuelve a "Pendiente"
  // cada vez que se edita hasta que el Super Admin lo revise de nuevo.
  const [testimonial, setTestimonial] = useState<MyTestimonial | null>(null)
  const [testimonialForm, setTestimonialForm] = useState({ content: '', authorName: '', barbershipName: '' })
  const [savingTestimonial, setSavingTestimonial] = useState(false)
  const [testimonialMsg, setTestimonialMsg] = useState('')

  useEffect(() => {
    api.get('/barbership-settings').then(r => {
      if (r.data) setForm(r.data)
    }).catch(() => {}).finally(() => setLoading(false))

    api.get('/my-testimonial').then(r => {
      if (r.data) {
        setTestimonial(r.data)
        setTestimonialForm({ content: r.data.content, authorName: r.data.authorName, barbershipName: r.data.barbershipName })
      }
    }).catch(() => {})
  }, [])

  async function saveTestimonial(e: React.FormEvent) {
    e.preventDefault()
    setSavingTestimonial(true); setTestimonialMsg('')
    try {
      await api.put('/my-testimonial', testimonialForm)
      const r = await api.get('/my-testimonial')
      setTestimonial(r.data)
      setTestimonialMsg('Testimonio guardado — queda pendiente de revisión por BarberOS')
    } catch {
      setTestimonialMsg('Error al guardar el testimonio')
    } finally {
      setSavingTestimonial(false)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      await api.put('/barbership-settings', {
        ...form,
        daysAheadNormalUser: form.daysAheadNormalUser ?? 0,
        basePriceNoService: form.basePriceNoService ?? 0,
        reminderMinutesBeforeAppointment: form.reminderMinutesBeforeAppointment ?? 20,
      })
      setMsg({ text: 'Ajustes guardados', error: false })
    } catch {
      setMsg({ text: 'Error al guardar', error: true })
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof BarbershipSettings>(key: K) => (v: BarbershipSettings[K]) =>
    setForm(f => ({ ...f, [key]: v }))

  // 23.20.11 — logo real de la barbería, persistido en disco, consumido en toda la app
  // (selector de barberías, novedades, panel SuperAdmin) en vez de iconos genéricos.
  async function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await uploadsService.uploadImage(file)
      await api.put('/barbership-settings/logo', { logoUrl: url })
      setForm(f => ({ ...f, logoUrl: url }))
      notifyBrandLogoUpdated()
      setMsg({ text: 'Logo actualizado', error: false })
    } catch {
      setMsg({ text: 'Error al subir el logo', error: true })
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function removeLogo() {
    await api.put('/barbership-settings/logo', { logoUrl: null })
    setForm(f => ({ ...f, logoUrl: null }))
    notifyBrandLogoUpdated()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <BackButton fallback="/barberia/dashboard" />
      <div>
        <h1 className="text-2xl font-black text-white">Ajustes de la barbería</h1>
        <p className="text-zinc-400 text-sm mt-1">Configura precios, anticipación de reservas y datos del negocio</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-red-600" /> Logo de la barbería
          </h2>
          <p className="text-zinc-500 text-xs">
            Reemplaza el ícono genérico de tijera por el logo real de tu barbería en el selector, novedades y panel de administración.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Scissors className="w-6 h-6 text-zinc-600" />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
              >
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                {uploadingLogo ? 'Subiendo...' : form.logoUrl ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="text-zinc-500 hover:text-red-400 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Quitar
                </button>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoPick} />
          </div>
        </section>

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
            <NumField
              allowDecimal={false}
              placeholder="0"
              value={form.daysAheadNormalUser}
              onValueChange={set('daysAheadNormalUser')}
              className="w-full"
            />
          </div>

          {/* 23.19 — tiempo mínimo de anticipación dentro del mismo día (no se puede reservar
              un horario que ya pasó ni uno demasiado próximo a la hora actual). */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Tiempo mínimo para reservar el mismo día</label>
            <select
              value={form.minLeadMinutes}
              onChange={e => set('minLeadMinutes')(parseInt(e.target.value, 10))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
            <p className="text-zinc-600 text-xs mt-1.5">Ningún cliente podrá reservar un horario que empiece antes de este margen, contado desde la hora actual de Colombia.</p>
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
            <NumField
              allowDecimal={false}
              placeholder="20"
              value={form.reminderMinutesBeforeAppointment}
              onValueChange={set('reminderMinutesBeforeAppointment')}
              className="w-28 focus:border-blue-500"
            />
            <span className="text-zinc-400 text-sm">minutos antes</span>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red-600" /> Precios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Precio base (sin servicio)</label>
              <NumField
                placeholder="0"
                value={form.basePriceNoService}
                onValueChange={set('basePriceNoService')}
                className="w-full"
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
              <NumField
                value={form.beardPrice}
                onValueChange={set('beardPrice')}
                className="w-full"
                placeholder="Sin costo adicional"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Cejas (opcional)</label>
              <NumField
                value={form.eyebrowPrice}
                onValueChange={set('eyebrowPrice')}
                className="w-full"
                placeholder="Sin costo adicional"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Lavado (opcional)</label>
              <NumField
                value={form.washPrice}
                onValueChange={set('washPrice')}
                className="w-full"
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

      {/* 23.20.11 — Mi Testimonio: máximo uno por barbería, queda pendiente de revisión tras crear o editar. */}
      <form onSubmit={saveTestimonial} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Quote className="w-4 h-4 text-red-600" /> Mi testimonio
          </h2>
          {testimonial && (
            <span className={`text-xs px-2.5 py-1 rounded-lg border ${statusLabel[testimonial.status]?.cls ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
              {statusLabel[testimonial.status]?.label ?? testimonial.status}
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs">
          Comparte tu opinión sobre BarberOS. El equipo de BarberOS revisa y aprueba antes de mostrarlo en Home, Login o Registro.
        </p>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Tu testimonio</label>
          <textarea
            value={testimonialForm.content}
            onChange={e => setTestimonialForm(f => ({ ...f, content: e.target.value }))}
            rows={3}
            maxLength={1000}
            placeholder="Desde que uso BarberOS..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-600 resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Tu nombre</label>
            <input
              type="text"
              value={testimonialForm.authorName}
              onChange={e => setTestimonialForm(f => ({ ...f, authorName: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-600"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Nombre de la barbería</label>
            <input
              type="text"
              value={testimonialForm.barbershipName}
              onChange={e => setTestimonialForm(f => ({ ...f, barbershipName: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-600"
              placeholder="Barbería El Clásico"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={savingTestimonial || !testimonialForm.content.trim() || !testimonialForm.authorName.trim() || !testimonialForm.barbershipName.trim()}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Quote className="w-4 h-4" />
            {savingTestimonial ? 'Guardando...' : testimonial ? 'Actualizar testimonio' : 'Enviar testimonio'}
          </button>
          {testimonialMsg && <span className="text-sm text-zinc-400">{testimonialMsg}</span>}
        </div>
      </form>
    </div>
  )
}
