import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Users, Phone, ShieldAlert } from 'lucide-react'
import { customersService } from '@/services/customers.service'
import { sanitizePhoneInput, validatePhone } from '@/utils/phone'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Customer, CreateCustomerRequest } from '@/types'

const empty: CreateCustomerRequest = { fullName: '', phone: '', email: '', notes: '' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<CreateCustomerRequest>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    customersService
      .list({ q: query || undefined, page, size: PAGE_SIZE })
      .then(r => { setCustomers(r.items); setTotalCount(r.totalCount) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query, page])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); setPage(1)
  }

  const handleSave = async () => {
    const phoneError = validatePhone(form.phone, true)
    if (phoneError) { setError(phoneError); return }
    setSaving(true); setError(null)
    try {
      await customersService.create(form)
      setModalOpen(false)
      setForm(empty)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'Error al crear el cliente')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">{totalCount} registrados</p>
        </div>
        <Button onClick={() => { setForm(empty); setError(null); setModalOpen(true) }} className="self-start sm:self-auto">
          <Plus size={16} />Nuevo cliente
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-red-600 transition-colors"
          placeholder="Buscar por nombre o teléfono..."
          value={query}
          onChange={handleSearch}
        />
      </div>

      {loading ? <PageSpinner /> : customers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No se encontraron clientes.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((c, i) => (
            <motion.div
              key={c.id}
              className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 flex items-center gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm shrink-0">
                {c.fullName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{c.fullName}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <Phone size={11} />{c.phone}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {c.noShowCount > 0 && (
                  <span className="text-xs text-red-600">{c.noShowCount} no-show</span>
                )}
                {c.isBlocked ? (
                  <Badge label="Bloqueado" variant="danger" />
                ) : (
                  <Badge label="Activo" variant="success" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-slate-400">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente">
        <div className="space-y-4">
          <Input label="Nombre completo *" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Juan Pérez" />
          <Input label="Teléfono *" type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))} placeholder="3001234567" />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="opcional" />
          <Input label="Notas" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Preferencias, alergias..." />
          {error && <p className="text-sm text-red-400 flex items-center gap-1"><ShieldAlert size={14} />{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" isLoading={saving} onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
