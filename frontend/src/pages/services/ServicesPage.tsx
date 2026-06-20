import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Scissors } from 'lucide-react'
import { servicesService } from '@/services/services.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCOP } from '@/utils/currency'
import type { Service, CreateServiceRequest } from '@/types'

const empty: CreateServiceRequest = {
  name: '', description: '', durationMinutes: 30, price: 0, currency: 'USD', category: '',
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<CreateServiceRequest>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () =>
    servicesService.list().then(setServices).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setError(null); setModalOpen(true) }
  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({ name: s.name, description: s.description ?? '', durationMinutes: s.durationMinutes, price: s.price, currency: s.currency, category: s.category ?? '' })
    setError(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      if (editing) {
        await servicesService.update(editing.id, { ...form, isActive: editing.isActive, sortOrder: editing.sortOrder })
      } else {
        await servicesService.create(form)
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Error al guardar el servicio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    await servicesService.remove(id).catch(() => {})
    load()
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Servicios</h1>
          <p className="text-slate-400 text-sm mt-1">{services.length} servicios configurados</p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto"><Plus size={16} />Nuevo servicio</Button>
      </div>

      {services.length === 0 ? (
        <Card className="p-12 text-center">
          <Scissors size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Aún no tienes servicios. Crea el primero.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <motion.div
              key={s.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-100">{s.name}</h3>
                  {s.category && <p className="text-xs text-slate-500 mt-0.5">{s.category}</p>}
                </div>
                <Badge label={s.isActive ? 'Activo' : 'Inactivo'} variant={s.isActive ? 'success' : 'neutral'} />
              </div>
              {s.description && <p className="text-sm text-slate-400 line-clamp-2">{s.description}</p>}
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-500 font-semibold">${formatCOP(s.price)} {s.currency}</span>
                <span className="text-slate-500">{s.durationMinutes} min</span>
              </div>
              <div className="flex gap-2 pt-1 border-t border-slate-700">
                <button onClick={() => openEdit(s)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                  <Pencil size={13} />Editar
                </button>
                <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors ml-auto cursor-pointer">
                  <Trash2 size={13} />Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar servicio' : 'Nuevo servicio'}>
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Corte clásico" />
          <Input label="Descripción" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción opcional" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio *" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))} />
            <Input label="Moneda" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} placeholder="USD" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duración (min) *" type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: +e.target.value }))} />
            <Input label="Categoría" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Corte, Color..." />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" isLoading={saving} onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
