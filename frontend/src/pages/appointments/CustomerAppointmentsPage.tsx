import { useState, useEffect } from 'react'
import {
  Calendar, Plus, Clock, X, ChevronLeft, Star, Building2,
} from 'lucide-react'
import { appointmentsService, type BookingEligibility } from '@/services/appointments.service'
import { barbersService } from '@/services/barbers.service'
import { servicesService } from '@/services/services.service'
import { authService } from '@/services/auth.service'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { BackButton } from '@/components/shared/BackButton'
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments'
import { formatCOP } from '@/utils/currency'
import type { Appointment, Barber, Service, AvailableSlot, MyTenant } from '@/types'

type Step = 'barbershop' | 'barber' | 'service' | 'date' | 'time' | 'extras' | 'confirm'
const STEPS: Step[] = ['barbershop', 'barber', 'service', 'date', 'time', 'extras', 'confirm']

interface Extras {
  beard: boolean
  eyebrow: boolean
  wash: boolean
}

interface AddonPrices {
  beardPrice?: number
  eyebrowPrice?: number
  washPrice?: number
}

function toDateString(d: Date) {
  return d.toISOString().split('T')[0]
}

function BookingModal({ minBookableDate, onClose, onBooked }: { minBookableDate: string; onClose: () => void; onBooked: () => void }) {
  const { user, setTokens } = useAuth()
  const [step, setStep] = useState<Step>('barbershop')
  const [tenants, setTenants] = useState<MyTenant[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [switchingTenant, setSwitchingTenant] = useState(false)
  const [activeTenantId, setActiveTenantId] = useState(user?.tenantId ?? '')
  const [resolvedMinBookableDate, setResolvedMinBookableDate] = useState(minBookableDate)
  const [minLeadMinutes, setMinLeadMinutes] = useState(30)
  const [daysAheadNormalUser, setDaysAheadNormalUser] = useState(0)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [addons, setAddons] = useState<AddonPrices>({})
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  // 23.15.1/23.15.2 — the date picker can never show a day before the barbershop's configured
  // advance-booking window (bypassed for preferred customers); the backend re-validates regardless.
  const [date, setDate] = useState(minBookableDate)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [extras, setExtras] = useState<Extras>({ beard: false, eyebrow: false, wash: false })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 23.16.3 — every booking starts by choosing which of the customer's barbershops to book
  // with; if they only belong to one, skip straight past this step.
  useEffect(() => {
    authService.myTenants().then(list => {
      setTenants(list)
      if (list.length <= 1) setStep('barber')
    }).catch(() => setStep('barber')).finally(() => setTenantsLoading(false))
  }, [])

  // Loads barbers/services/extras-pricing for whichever barbershop is currently active —
  // re-runs after selecting a different barbershop in step 0 (23.16.3).
  useEffect(() => {
    if (step === 'barbershop') return
    Promise.all([
      barbersService.list(),
      servicesService.list(),
      api.get('/barbership-settings').then(r => r.data).catch(() => ({})),
      appointmentsService.bookingEligibility().catch(() => null),
    ]).then(([b, s, settings, elig]) => {
      setBarbers(b.filter((x: Barber) => x.isActive))
      setServices(s)
      setAddons({ beardPrice: settings?.beardPrice, eyebrowPrice: settings?.eyebrowPrice, washPrice: settings?.washPrice })
      setMinLeadMinutes(settings?.minLeadMinutes ?? 30)
      setDaysAheadNormalUser(settings?.daysAheadNormalUser ?? 0)
      if (elig) {
        setResolvedMinBookableDate(elig.minBookableDate)
        setDate(prev => (prev < elig.minBookableDate ? elig.minBookableDate : prev))
      }
    })
  }, [step === 'barbershop'])

  async function selectTenant(tenantId: string) {
    if (tenantId !== activeTenantId) {
      setSwitchingTenant(true)
      try {
        const tokens = await authService.switchTenant(tenantId)
        setTokens(tokens)
        setActiveTenantId(tenantId)
      } finally {
        setSwitchingTenant(false)
      }
    }
    setStep('barber')
  }

  useEffect(() => {
    if (step !== 'time' || !barberId || !serviceId) return
    setSlotsLoading(true); setSlots([])
    appointmentsService.availableSlots(barberId, date, serviceId)
      .then(setSlots).catch(() => setSlots([])).finally(() => setSlotsLoading(false))
  }, [step, barberId, serviceId, date])

  const selectedService = services.find(s => s.id === serviceId)
  const extrasTotal =
    (extras.beard ? addons.beardPrice ?? 0 : 0) +
    (extras.eyebrow ? addons.eyebrowPrice ?? 0 : 0) +
    (extras.wash ? addons.washPrice ?? 0 : 0)
  const total = (selectedService?.price ?? 0) + extrasTotal

  // 23.19.3 — never show just an empty list; tell the customer exactly why there's nothing to pick.
  function emptySlotsReason(): string {
    if (date < resolvedMinBookableDate) {
      return `Debes esperar ${daysAheadNormalUser} día(s) para reservar. Primera fecha disponible: ${new Date(resolvedMinBookableDate + 'T12:00:00').toLocaleDateString('es-CO')}.`
    }
    if (date === toDateString(new Date())) {
      return `Debes reservar con al menos ${minLeadMinutes} minutos de anticipación, y ya no quedan horarios disponibles hoy dentro de ese margen.`
    }
    return 'No hay horarios disponibles para esta fecha (fuera del horario laboral o ya reservados). Vuelve al paso anterior y elige otro día.'
  }

  function stepIndex(s: Step) { return STEPS.indexOf(s) }
  function goNext() { setStep(STEPS[stepIndex(step) + 1]) }
  function goBack() { setStep(STEPS[stepIndex(step) - 1]) }

  async function confirm() {
    setSaving(true); setError(null)
    try {
      const addOns = [
        extras.beard && addons.beardPrice != null && { name: 'Barba', price: addons.beardPrice },
        extras.eyebrow && addons.eyebrowPrice != null && { name: 'Cejas', price: addons.eyebrowPrice },
        extras.wash && addons.washPrice != null && { name: 'Lavado', price: addons.washPrice },
      ].filter((x): x is { name: string; price: number } => !!x)
      await appointmentsService.book({ barberId, serviceId, startsAt, notes: notes || undefined, addOns: addOns.length ? addOns : undefined })
      onBooked()
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'Error al agendar la cita')
    } finally {
      setSaving(false)
    }
  }

  const stepLabels: Record<Step, string> = {
    barbershop: 'Barbería', barber: 'Barbero', service: 'Servicio', date: 'Fecha', time: 'Hora', extras: 'Extras', confirm: 'Confirmar',
  }
  const activeTenantName = tenants.find(t => t.tenantId === activeTenantId)?.name

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-bold">Nueva cita</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Paso {stepIndex(step) + 1} de {STEPS.length} · {stepLabels[step]}
              {step !== 'barbershop' && activeTenantName && <> · <span className="text-red-500">{activeTenantName}</span></>}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {step === 'barbershop' && (
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm mb-2">¿En qué barbería deseas reservar?</p>
              {tenantsLoading ? (
                <p className="text-zinc-500 text-sm">Cargando barberías...</p>
              ) : tenants.map(t => (
                <button
                  key={t.tenantId}
                  onClick={() => selectTenant(t.tenantId)}
                  disabled={switchingTenant}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${t.tenantId === activeTenantId ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'} disabled:opacity-50`}
                >
                  <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-white font-medium text-sm">{t.name}</span>
                </button>
              ))}
              {!tenantsLoading && tenants.length === 0 && <p className="text-zinc-500 text-sm">No tienes barberías vinculadas.</p>}
            </div>
          )}

          {step === 'barber' && (
            <div className="space-y-2">
              {barbers.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setBarberId(b.id); goNext() }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${barberId === b.id ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'}`}
                >
                  <p className="text-white font-medium text-sm">{b.displayName}</p>
                </button>
              ))}
              {barbers.length === 0 && <p className="text-zinc-500 text-sm">No hay barberos disponibles.</p>}
            </div>
          )}

          {step === 'service' && (
            <div className="space-y-2">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setServiceId(s.id); goNext() }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${serviceId === s.id ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'}`}
                >
                  <div>
                    <p className="text-white font-medium text-sm">{s.name}</p>
                    <p className="text-zinc-500 text-xs">{s.durationMinutes} min</p>
                  </div>
                  <span className="text-red-500 font-semibold text-sm">${formatCOP(s.price)}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'date' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">Selecciona la fecha de tu cita</p>
              <input
                type="date"
                value={date}
                min={resolvedMinBookableDate}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
              />
              {resolvedMinBookableDate > toDateString(new Date()) && (
                <p className="text-zinc-500 text-xs">Esta barbería requiere reservar con anticipación — primera fecha disponible: {new Date(resolvedMinBookableDate + 'T12:00:00').toLocaleDateString('es-CO')}</p>
              )}
              <button onClick={goNext} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                Consultar disponibilidad
              </button>
            </div>
          )}

          {step === 'time' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">Horarios disponibles el {new Date(date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              {slotsLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : slots.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">{emptySlotsReason()}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {slots.map(s => (
                    <button
                      key={s.startsAt}
                      onClick={() => { setStartsAt(s.startsAt); goNext() }}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${startsAt === s.startsAt ? 'bg-red-600 text-white border-red-600' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-red-600'}`}
                    >
                      {new Date(s.startsAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'extras' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">Servicios adicionales (opcional)</p>
              {([
                ['beard', 'Barba', addons.beardPrice],
                ['eyebrow', 'Cejas', addons.eyebrowPrice],
                ['wash', 'Lavado', addons.washPrice],
              ] as const).map(([key, label, price]) => (
                <label key={key} className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 cursor-pointer">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extras[key]}
                      onChange={e => setExtras(prev => ({ ...prev, [key]: e.target.checked }))}
                      disabled={price === undefined || price === null}
                      className="w-4 h-4 accent-red-600"
                    />
                    <span className="text-white text-sm">{label}</span>
                  </span>
                  <span className="text-zinc-400 text-sm">{price ? `$${formatCOP(price)}` : 'No disponible'}</span>
                </label>
              ))}
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas adicionales (opcional)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-600"
              />
              <button onClick={goNext} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                Continuar
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Barbero</span><span className="text-white">{barbers.find(b => b.id === barberId)?.displayName}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Servicio</span><span className="text-white">{selectedService?.name} — ${formatCOP(selectedService?.price ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Fecha</span><span className="text-white">{new Date(date + 'T12:00:00').toLocaleDateString('es-CO')}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Hora</span><span className="text-white">{startsAt && new Date(startsAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}</span></div>
                {extrasTotal > 0 && (
                  <div className="flex justify-between"><span className="text-zinc-500">Extras</span><span className="text-white">+${formatCOP(extrasTotal)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-zinc-700 font-bold"><span className="text-zinc-300">Total</span><span className="text-red-500">${formatCOP(total)}</span></div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={confirm}
                disabled={saving}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Confirmando...' : 'Confirmar cita'}
              </button>
            </div>
          )}
        </div>

        {step !== 'barbershop' && !(step === 'barber' && tenants.length <= 1) && (
          <div className="px-6 pb-4">
            <button onClick={goBack} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CustomerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [bookOpen, setBookOpen] = useState(false)
  const [eligibility, setEligibility] = useState<BookingEligibility | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [appts, elig] = await Promise.all([
        appointmentsService.mine(),
        appointmentsService.bookingEligibility(),
      ])
      setAppointments(appts)
      setEligibility(elig)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useRealtimeAppointments(() => load())

  function handleNewAppointment() {
    if (eligibility && !eligibility.canBook) return
    setBookOpen(true)
  }

  const now = new Date()
  const upcoming = appointments
    .filter(a => (a.status === 'Pending' || a.status === 'Confirmed') && new Date(a.startsAt) > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const nextAppointment = upcoming[0]

  const history = appointments
    .filter(a => a.status === 'Completed' || a.status === 'NoShow' || a.status.startsWith('Cancelled') || a.canRate)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  const ratingReady = eligibility && !eligibility.canBook && eligibility.ratingAvailableAt
    ? new Date(eligibility.ratingAvailableAt) <= now
    : false

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <BackButton fallback="/user/dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Mis citas</h1>
        <button
          onClick={handleNewAppointment}
          disabled={!!eligibility && !eligibility.canBook}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva cita
        </button>
      </div>

      {eligibility && !eligibility.canBook && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Star className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm">{eligibility.reason}</p>
            {eligibility.ratingAvailableAt && !ratingReady && (
              <p className="text-zinc-500 text-xs mt-1">
                Podrás calificar a partir de las {new Date(eligibility.ratingAvailableAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Próxima cita */}
      {nextAppointment ? (
        <div className="bg-gradient-to-br from-red-700/20 via-zinc-900 to-blue-700/20 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-2">Tu próxima cita</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              {nextAppointment.tenantName && (
                <p className="text-red-400 text-[11px] font-bold uppercase tracking-wide mb-0.5">{nextAppointment.tenantName}</p>
              )}
              <p className="text-white text-xl font-black">{nextAppointment.serviceName}</p>
              <p className="text-zinc-400 text-sm mt-1">con {nextAppointment.barberName}</p>
              {nextAppointment.addOns && nextAppointment.addOns.length > 0 && (
                <p className="text-zinc-500 text-xs mt-1">+ {nextAppointment.addOns.map(a => a.name).join(', ')}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">
                {new Date(nextAppointment.startsAt).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-red-400 text-sm font-medium">
                {new Date(nextAppointment.startsAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}
              </p>
              {nextAppointment.totalPrice != null && (
                <p className="text-zinc-400 text-xs mt-0.5">Total: ${formatCOP(nextAppointment.totalPrice)}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-zinc-700" />
          <p className="text-zinc-400 text-sm">No tienes citas próximas</p>
        </div>
      )}

      {/* Historial */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-red-600" /> Historial</h2>
        </div>
        {history.length === 0 ? (
          <p className="px-6 py-8 text-center text-zinc-600 text-sm">Aún no tienes citas anteriores</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {history.map(a => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div>
                  {/* 23.16.6 — cada cita del historial muestra la barbería de origen, ya que
                      "Mis citas" ahora consolida todas las barberías del cliente. */}
                  {a.tenantName && <p className="text-zinc-600 text-[11px] font-semibold uppercase tracking-wide">{a.tenantName}</p>}
                  <p className="text-white font-semibold text-sm">{a.serviceName}</p>
                  <p className="text-zinc-500 text-xs">con {a.barberName} · {new Date(a.startsAt).toLocaleDateString('es-CO')}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg shrink-0 ${
                  a.status === 'NoShow' ? 'bg-orange-500/15 text-orange-400'
                  : a.status.startsWith('Cancelled') ? 'bg-zinc-800 text-zinc-500'
                  : 'bg-green-500/15 text-green-400'
                }`}>
                  {a.status === 'NoShow' ? 'No asistió' : a.status.startsWith('Cancelled') ? 'Cancelada' : 'Asistió'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {bookOpen && (
        <BookingModal
          minBookableDate={eligibility?.minBookableDate ?? toDateString(new Date())}
          onClose={() => setBookOpen(false)}
          onBooked={() => { setBookOpen(false); load() }}
        />
      )}
    </div>
  )
}
