import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, UserCheck, Power, Trash2, CalendarClock, X } from 'lucide-react'
import { barbersService } from '@/services/barbers.service'
import { sanitizePhoneInput, validatePhone } from '@/utils/phone'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { useConfirm } from '@/contexts/ConfirmContext'
import { BackButton } from '@/components/shared/BackButton'
import type { Barber, CreateBarberRequest, WorkSchedule } from '@/types'

const empty: CreateBarberRequest = { displayName: '', phone: '' }

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

interface DaySlot {
  enabled: boolean
  startTime: string
  endTime: string
  hasBreak: boolean
  breakStart: string
  breakEnd: string
}

function emptyDaySlot(): DaySlot {
  return { enabled: false, startTime: '08:00', endTime: '18:00', hasBreak: false, breakStart: '12:00', breakEnd: '14:00' }
}

export default function BarbersPage() {
  const confirmDialog = useConfirm()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Barber | null>(null)
  const [form, setForm] = useState<CreateBarberRequest>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Schedule editor
  const [scheduleBarber, setScheduleBarber] = useState<Barber | null>(null)
  const [scheduleDays, setScheduleDays] = useState<Record<number, DaySlot>>({})
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleMsg, setScheduleMsg] = useState<{ text: string; error: boolean } | null>(null)

  const load = () =>
    barbersService.list().then(setBarbers).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setError(null); setModalOpen(true) }
  const openEdit = (b: Barber) => {
    setEditing(b)
    setForm({ displayName: b.displayName, phone: b.phone ?? '' })
    setError(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const phoneError = validatePhone(form.phone ?? '')
    if (phoneError) { setError(phoneError); return }
    setSaving(true); setError(null)
    try {
      if (editing) {
        await barbersService.update(editing.id, { ...form, isActive: editing.isActive, photoUrl: editing.photoUrl })
      } else {
        await barbersService.create(form)
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(b: Barber) {
    await barbersService.update(b.id, { displayName: b.displayName, phone: b.phone, photoUrl: b.photoUrl, isActive: !b.isActive })
    load()
  }

  async function removeBarber(b: Barber) {
    if (!await confirmDialog(`Eliminar a ${b.displayName} del equipo? Esta acción no se puede deshacer.`)) return
    await barbersService.remove(b.id)
    load()
  }

  async function openSchedule(b: Barber) {
    setScheduleBarber(b)
    setScheduleMsg(null)
    setScheduleLoading(true)
    const initial: Record<number, DaySlot> = {}
    for (const d of DAYS) initial[d.value] = emptyDaySlot()
    try {
      const existing = await barbersService.getSchedule(b.id)
      for (const slot of existing) {
        initial[slot.weekday] = {
          enabled: true,
          startTime: slot.startTime.slice(0, 5),
          endTime: slot.endTime.slice(0, 5),
          hasBreak: !!slot.breakStart,
          breakStart: slot.breakStart ? slot.breakStart.slice(0, 5) : '12:00',
          breakEnd: slot.breakEnd ? slot.breakEnd.slice(0, 5) : '14:00',
        }
      }
    } catch { /* no existing schedule yet */ }
    setScheduleDays(initial)
    setScheduleLoading(false)
  }

  function updateDay(day: number, patch: Partial<DaySlot>) {
    setScheduleDays(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }))
  }

  function applyToAllWeekdays() {
    const monday = scheduleDays[1]
    if (!monday) return
    setScheduleDays(prev => {
      const next = { ...prev }
      for (const d of [1, 2, 3, 4, 5]) next[d] = { ...monday }
      return next
    })
  }

  async function saveSchedule() {
    if (!scheduleBarber) return
    setScheduleSaving(true); setScheduleMsg(null)
    try {
      const slots: WorkSchedule[] = Object.entries(scheduleDays)
        .filter(([, d]) => d.enabled)
        .map(([weekday, d]) => ({
          weekday: Number(weekday),
          startTime: d.startTime,
          endTime: d.endTime,
          breakStart: d.hasBreak ? d.breakStart : null,
          breakEnd: d.hasBreak ? d.breakEnd : null,
        }))
      await barbersService.setSchedule(scheduleBarber.id, slots)
      setScheduleMsg({ text: 'Horario guardado', error: false })
    } catch {
      setScheduleMsg({ text: 'Error al guardar el horario', error: true })
    } finally {
      setScheduleSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <BackButton fallback="/barberia/dashboard" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Equipo de barberos</h1>
          <p className="text-slate-400 text-sm mt-1">{barbers.length} en tu equipo</p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto"><Plus size={16} />Nuevo barbero</Button>
      </div>

      {barbers.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCheck size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Agrega tu primer barbero.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((b, i) => (
            <motion.div
              key={b.id}
              className={`bg-slate-800 border rounded-2xl p-5 flex flex-col gap-3 ${b.isActive ? 'border-slate-700' : 'border-slate-700/50 opacity-60'}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: b.isActive ? 1 : 0.6, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center text-red-500 text-lg font-bold shrink-0">
                  {b.displayName[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{b.displayName}</p>
                  <p className="text-xs text-slate-500">{b.phone ?? 'Sin teléfono'}</p>
                </div>
                <div className="ml-auto">
                  <Badge label={b.isActive ? 'Activo' : 'Inactivo'} variant={b.isActive ? 'success' : 'neutral'} />
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-1 border-t border-slate-700 pt-2 -mx-1">
                <button
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                >
                  <Pencil size={13} />Editar
                </button>
                <button
                  onClick={() => openSchedule(b)}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                >
                  <CalendarClock size={13} />Horario
                </button>
                <button
                  onClick={() => toggleActive(b)}
                  className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer ${b.isActive ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'}`}
                >
                  <Power size={13} />{b.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => removeBarber(b)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer ml-auto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar barbero' : 'Nuevo barbero'}>
        <div className="space-y-4">
          <Input label="Nombre *" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Carlos Mendoza" />
          <Input label="Teléfono" type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))} placeholder="3001234567" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" isLoading={saving} onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Schedule editor */}
      {scheduleBarber && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Horario de {scheduleBarber.displayName}</h3>
                <p className="text-zinc-500 text-sm mt-0.5">Días, horas y descansos — los clientes solo verán turnos dentro de estas reglas</p>
              </div>
              <button onClick={() => setScheduleBarber(null)} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {scheduleLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <button onClick={applyToAllWeekdays} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Copiar horario del lunes a toda la semana laboral
                </button>

                <div className="space-y-2">
                  {DAYS.map(d => {
                    const slot = scheduleDays[d.value] ?? emptyDaySlot()
                    return (
                      <div key={d.value} className={`rounded-xl border p-3 ${slot.enabled ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-800 bg-zinc-900/40'}`}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="flex items-center gap-2 w-28 shrink-0">
                            <input
                              type="checkbox"
                              checked={slot.enabled}
                              onChange={e => updateDay(d.value, { enabled: e.target.checked })}
                              className="w-4 h-4 accent-red-600"
                            />
                            <span className={`text-sm font-medium ${slot.enabled ? 'text-white' : 'text-zinc-500'}`}>{d.label}</span>
                          </label>

                          {slot.enabled && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <input type="time" value={slot.startTime} onChange={e => updateDay(d.value, { startTime: e.target.value })}
                                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-red-600" />
                                <span className="text-zinc-500 text-xs">a</span>
                                <input type="time" value={slot.endTime} onChange={e => updateDay(d.value, { endTime: e.target.value })}
                                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-red-600" />
                              </div>

                              <label className="flex items-center gap-1.5 ml-auto">
                                <input
                                  type="checkbox"
                                  checked={slot.hasBreak}
                                  onChange={e => updateDay(d.value, { hasBreak: e.target.checked })}
                                  className="w-3.5 h-3.5 accent-blue-500"
                                />
                                <span className="text-xs text-zinc-400">Descanso</span>
                              </label>

                              {slot.hasBreak && (
                                <div className="flex items-center gap-1.5">
                                  <input type="time" value={slot.breakStart} onChange={e => updateDay(d.value, { breakStart: e.target.value })}
                                    className="bg-zinc-800 border border-blue-700/40 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500" />
                                  <span className="text-zinc-500 text-xs">a</span>
                                  <input type="time" value={slot.breakEnd} onChange={e => updateDay(d.value, { breakEnd: e.target.value })}
                                    className="bg-zinc-800 border border-blue-700/40 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {scheduleMsg && <p className={`text-sm ${scheduleMsg.error ? 'text-red-500' : 'text-green-400'}`}>{scheduleMsg.text}</p>}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setScheduleBarber(null)} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors">
                    Cerrar
                  </button>
                  <button
                    onClick={saveSchedule}
                    disabled={scheduleSaving}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {scheduleSaving ? 'Guardando...' : 'Guardar horario'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
