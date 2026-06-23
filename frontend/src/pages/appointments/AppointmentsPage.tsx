import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock, Search, CheckCircle2, Play, Flag, Trash2, XCircle } from 'lucide-react'
import { appointmentsService } from '@/services/appointments.service'
import { servicesService } from '@/services/services.service'
import { barbersService } from '@/services/barbers.service'
import { clientsService, type Client } from '@/services/clients.service'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments'
import { useConfirm } from '@/contexts/ConfirmContext'
import { formatCOP } from '@/utils/currency'
import type { Appointment, Barber, Service, BookAppointmentRequest, AvailableSlot } from '@/types'

const statusLabel: Record<string, string> = {
  Pending: 'Pendiente', Confirmed: 'Confirmada', InProgress: 'En curso',
  Completed: 'Completada', CancelledByCustomer: 'Cancelada', CancelledByBarber: 'Cancelada', NoShow: 'No-show',
}
const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Pending: 'warning', Confirmed: 'info', InProgress: 'info', Completed: 'success',
  CancelledByCustomer: 'danger', CancelledByBarber: 'danger', NoShow: 'neutral',
}

function toDateString(d: Date) {
  return d.toISOString().split('T')[0]
}

/** Agenda de gestión para el barbero/dueño — navegación por día, equipo, clientes. */
export default function AppointmentsPage() {
  const confirmDialog = useConfirm()
  const [date, setDate] = useState(toDateString(new Date()))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)

  // Booking modal state
  const [bookOpen, setBookOpen] = useState(false)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [clientQuery, setClientQuery] = useState('')
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<BookAppointmentRequest>>({})

  const load = useCallback(() => {
    setLoading(true)
    appointmentsService.listByDate(date)
      .then(setAppointments).catch(() => {}).finally(() => setLoading(false))
  }, [date])

  useEffect(() => { load() }, [load])

  useRealtimeAppointments(() => {
    load()
    if (bookOpen) loadSlots()
  })

  const openBook = async () => {
    setForm({}); setSlots([]); setBookError(null); setClientQuery('')
    const [b, s, c] = await Promise.all([
      barbersService.list(),
      servicesService.list(),
      clientsService.list(),
    ])
    setBarbers(b.filter(barber => barber.isActive))
    setServices(s)
    setClients(c)
    setBookOpen(true)
  }

  const filteredClients = clients.filter(c => c.fullName.toLowerCase().includes(clientQuery.toLowerCase()))

  const loadSlots = useCallback(async () => {
    if (!form.barberId || !form.serviceId) return
    setSlotsLoading(true)
    setSlots([])
    try {
      const s = await appointmentsService.availableSlots(form.barberId, date, form.serviceId)
      setSlots(s)
    } catch { setSlots([]) } finally { setSlotsLoading(false) }
  }, [form.barberId, form.serviceId, date])

  useEffect(() => { if (bookOpen) loadSlots() }, [form.barberId, form.serviceId, loadSlots, bookOpen])

  const handleBook = async () => {
    if (!form.customerId || !form.barberId || !form.serviceId || !form.startsAt) {
      setBookError('Completa todos los campos'); return
    }
    setSaving(true); setBookError(null)
    try {
      await appointmentsService.book(form as BookAppointmentRequest)
      setBookOpen(false); load()
    } catch (err: any) {
      setBookError(err?.response?.data?.title ?? 'Error al agendar la cita')
    } finally { setSaving(false) }
  }

  async function advanceStatus(a: Appointment) {
    setActioning(a.id)
    try {
      if (a.status === 'Pending') await appointmentsService.confirm(a.id)
      else if (a.status === 'Confirmed') await appointmentsService.start(a.id)
      else if (a.status === 'InProgress') await appointmentsService.complete(a.id)
      load()
    } finally { setActioning(null) }
  }

  // El barbero puede marcar directamente "No asistió" sin pasar primero por Confirmar — las
  // citas no necesitan confirmarse para poder registrar que el cliente no llegó.
  async function markNoShow(a: Appointment) {
    if (!await confirmDialog(`Marcar a ${a.customerName} como no asistió?`, { confirmLabel: 'No asistió' })) return
    setActioning(a.id)
    try {
      await appointmentsService.noShow(a.id)
      load()
    } finally { setActioning(null) }
  }

  // 23.14.2 — only barbers/owners reach this screen at all (CustomerAppointmentsPage is the
  // customer-facing one), so any authenticated viewer here is already authorized; the backend
  // re-checks cancelledByBarber=true requires the Barber role regardless of what's sent here.
  async function deleteAppointment(a: Appointment) {
    if (!await confirmDialog(`Eliminar la cita de ${a.customerName}? Esta acción no se puede deshacer.`)) return
    setActioning(a.id)
    try {
      await appointmentsService.cancel(a.id, 'Eliminada por la barbería', true)
      load()
    } finally { setActioning(null) }
  }

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDate(toDateString(d))
  }

  const nextActionLabel: Record<string, { label: string; icon: any }> = {
    Pending: { label: 'Confirmar', icon: CheckCircle2 },
    Confirmed: { label: 'Iniciar', icon: Play },
    InProgress: { label: 'Finalizar', icon: Flag },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Citas</h1>
          <p className="text-slate-400 text-sm mt-1">{appointments.length} para este día</p>
        </div>
        <Button onClick={openBook} className="self-start sm:self-auto"><Plus size={16} />Nueva cita</Button>
      </div>

      {/* Date nav — herramienta de gestión, exclusiva del panel de barbería */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 outline-none focus:border-red-600 transition-colors min-h-[44px]"
        />
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronRight size={18} />
        </button>
        <Button variant="ghost" size="sm" onClick={() => setDate(toDateString(new Date()))}>Hoy</Button>
      </div>

      {loading ? <PageSpinner /> : appointments.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No hay citas para este día.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {appointments
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
            .map((a, i) => {
              const next = nextActionLabel[a.status]
              return (
                <motion.div
                  key={a.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 flex items-center flex-wrap gap-4"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="text-center w-14 shrink-0">
                    <p className="text-sm font-bold text-red-500">
                      {new Date(a.startsAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-0.5 justify-center mt-0.5">
                      <Clock size={10} />{a.serviceName.substring(0, 8)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{a.customerName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.serviceName} · {a.barberName}</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-3 shrink-0 sm:ml-auto">
                    <span className="text-sm font-semibold text-slate-300">${formatCOP(a.servicePrice)}</span>
                    <Badge label={statusLabel[a.status]} variant={statusVariant[a.status]} />
                    {next && (
                      <button
                        onClick={() => advanceStatus(a)}
                        disabled={actioning === a.id}
                        className="flex items-center gap-1 text-xs bg-red-600/15 text-red-400 hover:bg-red-600/25 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <next.icon size={12} />{next.label}
                      </button>
                    )}
                    {(a.status === 'Pending' || a.status === 'Confirmed' || a.status === 'InProgress') && (
                      <button
                        onClick={() => markNoShow(a)}
                        disabled={actioning === a.id}
                        className="flex items-center gap-1 text-xs bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle size={12} />No asistió
                      </button>
                    )}
                    {(a.status === 'Pending' || a.status === 'Confirmed' || a.status === 'InProgress') && (
                      <button
                        onClick={() => deleteAppointment(a)}
                        disabled={actioning === a.id}
                        title="Eliminar cita"
                        className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
        </div>
      )}

      {/* Book Modal */}
      <Modal isOpen={bookOpen} onClose={() => setBookOpen(false)} title="Nueva cita" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300 font-medium">Cliente *</label>
              <div className="relative mb-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={clientQuery}
                  onChange={e => setClientQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-xs outline-none focus:border-red-600"
                />
              </div>
              <select
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm outline-none focus:border-red-600"
                value={form.customerId ?? ''}
                onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {filteredClients.map(c => <option key={c.userId} value={c.userId}>{c.fullName}{c.isPreferred ? ' ⭐' : ''}</option>)}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">Aún no tienes clientes vinculados por código de invitación.</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300 font-medium">Barbero *</label>
              <select
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm outline-none focus:border-red-600"
                value={form.barberId ?? ''}
                onChange={e => setForm(p => ({ ...p, barberId: e.target.value, startsAt: undefined }))}
              >
                <option value="">Seleccionar...</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.displayName}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-300 font-medium">Servicio *</label>
            <select
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm outline-none focus:border-red-600"
              value={form.serviceId ?? ''}
              onChange={e => setForm(p => ({ ...p, serviceId: e.target.value, startsAt: undefined }))}
            >
              <option value="">Seleccionar...</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes}min · ${formatCOP(s.price)})</option>)}
            </select>
          </div>

          {/* Slots */}
          {form.barberId && form.serviceId && (
            <div>
              <label className="text-sm text-slate-300 font-medium block mb-2">Hora de la cita *</label>
              {slotsLoading ? (
                <p className="text-sm text-slate-500">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-500">No hay horarios disponibles para esta fecha.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
                  {slots.map(s => (
                    <button
                      key={s.startsAt}
                      onClick={() => setForm(p => ({ ...p, startsAt: s.startsAt }))}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border min-h-[40px]
                        ${form.startsAt === s.startsAt
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-red-600'}`}
                    >
                      {new Date(s.startsAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Input label="Notas" value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Instrucciones adicionales..." />

          {bookError && <p className="text-sm text-red-400">{bookError}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setBookOpen(false)}>Cancelar</Button>
            <Button className="flex-1" isLoading={saving} onClick={handleBook}>Agendar cita</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
