import { useState, useEffect } from 'react'
import { Star, Percent, Trash2, Users, Search, AlertTriangle } from 'lucide-react'
import { api } from '@/services/api'

interface Client {
  id: string
  userId: string
  fullName: string
  email: string
  phone?: string
  isPreferred: boolean
  penaltyPercentage: number
  joinedAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [penaltyModal, setPenaltyModal] = useState<Client | null>(null)
  const [penaltyValue, setPenaltyValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/clients')
      setClients(r.data ?? [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function togglePreferred(client: Client) {
    setSaving(true)
    try {
      await api.patch(`/clients/${client.userId}/preferred`, { isPreferred: !client.isPreferred })
      load()
    } finally { setSaving(false) }
  }

  async function setPenalty(client: Client) {
    const pct = parseInt(penaltyValue, 10)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    setSaving(true)
    try {
      await api.patch(`/clients/${client.userId}/penalty`, { penaltyPercentage: pct })
      setPenaltyModal(null); setPenaltyValue(''); load()
    } finally { setSaving(false) }
  }

  async function removeClient(client: Client) {
    if (!confirm(`Eliminar a ${client.fullName} de tu barberia? Esta accion no se puede deshacer.`)) return
    await api.delete(`/clients/${client.userId}`)
    load()
  }

  const filtered = clients.filter(c =>
    c.fullName.toLowerCase().includes(query.toLowerCase()) ||
    c.email.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Clientes</h1>
        <p className="text-zinc-400 text-sm mt-1">{clients.length} clientes en tu barberia</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          className="w-full pl-9 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600"
          placeholder="Buscar clientes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex gap-3 text-sm text-zinc-400">
        <Star className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Clientes preferidos</span> pueden agendar citas desde el dia siguiente.
          Los demas deben esperar segun el tiempo configurado en ajustes.
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">{query ? 'Sin resultados' : 'No tienes clientes aun'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{c.fullName[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm truncate">{c.fullName}</p>
                  {c.isPreferred && <Star className="w-3.5 h-3.5 text-red-600 fill-red-600 shrink-0" />}
                </div>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">{c.email}</p>
                {c.penaltyPercentage > 0 && (
                  <p className="text-red-400 text-xs mt-0.5">Penalizacion: +{c.penaltyPercentage}%</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePreferred(c)}
                  disabled={saving}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    c.isPreferred
                      ? 'bg-red-600/20 text-red-600 hover:bg-red-600/30'
                      : 'bg-zinc-800 text-zinc-500 hover:text-red-500'
                  }`}
                  title={c.isPreferred ? 'Quitar preferido' : 'Marcar preferido'}
                >
                  <Star className={`w-4 h-4 ${c.isPreferred ? 'fill-red-600' : ''}`} />
                </button>
                <button
                  onClick={() => { setPenaltyModal(c); setPenaltyValue(String(c.penaltyPercentage)) }}
                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-orange-500/10 flex items-center justify-center transition-colors group"
                  title="Establecer penalizacion"
                >
                  <Percent className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                </button>
                <button
                  onClick={() => removeClient(c)}
                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-red-500/10 flex items-center justify-center transition-colors group"
                  title="Eliminar cliente"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {penaltyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-bold">Penalizacion para {penaltyModal.fullName}</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              El porcentaje se le incrementara en la proxima cita como penalizacion. Pon 0 para quitar la penalizacion.
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-600"
                  value={penaltyValue}
                  onChange={e => setPenaltyValue(e.target.value)}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPenaltyModal(null); setPenaltyValue('') }}
                className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setPenalty(penaltyModal)}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
