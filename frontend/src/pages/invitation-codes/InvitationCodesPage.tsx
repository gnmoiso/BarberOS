import { useState, useEffect } from 'react'
import { Copy, Plus, Trash2, Key, CheckCircle, XCircle, QrCode, Download, X } from 'lucide-react'
import QRCode from 'qrcode'
import { api } from '@/services/api'
import { useConfirm } from '@/contexts/ConfirmContext'

interface InvitationCode {
  id: string
  code: string
  isActive: boolean
  createdAt: string
  usageCount: number
}

function joinUrlFor(codeId: string) {
  // The link carries the code's opaque id, never the readable code text, so sharing
  // or scanning it never exposes the barbershop's invitation code in plain sight.
  return `${window.location.origin}/join?token=${codeId}`
}

function QrModal({ codeId, onClose }: { codeId: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(joinUrlFor(codeId), { width: 320, margin: 2, color: { dark: '#18181b', light: '#ffffff' } })
      .then(setDataUrl)
  }, [codeId])

  function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'invitacion-barberos.png'
    a.click()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-white font-bold text-sm">Codigo QR de invitacion</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 flex items-center justify-center min-h-[260px]">
          {dataUrl
            ? <img src={dataUrl} alt="Codigo QR" className="w-full h-auto" />
            : <div className="w-8 h-8 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
          }
        </div>
        <p className="text-zinc-500 text-xs text-center">
          Quien escanee este QR (o abra el enlace) podra unirse directamente a tu barberia, sin ver el codigo.
        </p>
        <button
          onClick={download}
          disabled={!dataUrl}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar QR
        </button>
      </div>
    </div>
  )
}

export default function InvitationCodesPage() {
  const confirmDialog = useConfirm()
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrFor, setQrFor] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/invitation-codes')
      setCodes(r.data ?? [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!newCode.trim() || newCode.length !== 10) {
      setError('El codigo debe tener exactamente 10 caracteres')
      return
    }
    setCreating(true); setError(null)
    try {
      await api.post('/invitation-codes', { code: newCode.toUpperCase() })
      setNewCode(''); load()
    } catch (e: any) {
      setError(e.response?.data?.title ?? 'Error al crear codigo')
    } finally { setCreating(false) }
  }

  async function deactivate(id: string) {
    if (!await confirmDialog('Desactivar este codigo de invitacion?', { confirmLabel: 'Desactivar' })) return
    await api.delete(`/invitation-codes/${id}`)
    load()
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Codigos de Invitacion</h1>
        <p className="text-zinc-400 text-sm mt-1">Comparte estos codigos con tus clientes para que se unan a tu barberia</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <h2 className="text-white font-bold text-sm">Generar nuevo codigo</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              className="w-full pl-9 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 font-mono uppercase tracking-widest"
              placeholder="XXXXXXXXXXXX"
              maxLength={10}
              value={newCode}
              onChange={e => { setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && create()}
            />
          </div>
          <button
            onClick={create}
            disabled={creating || newCode.length !== 10}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear
          </button>
        </div>
        <p className="text-zinc-600 text-xs">{newCode.length}/10 caracteres — solo letras y numeros</p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No tienes codigos de invitacion aun</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.isActive ? 'bg-green-500/10' : 'bg-zinc-800'}`}>
                {c.isActive
                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                  : <XCircle className="w-4 h-4 text-zinc-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-mono font-bold tracking-[0.2em] text-sm ${c.isActive ? 'text-white' : 'text-zinc-600 line-through'}`}>
                  {c.code}
                </p>
                <p className="text-zinc-600 text-xs mt-0.5">
                  {c.usageCount ?? 0} uso{c.usageCount !== 1 ? 's' : ''} · creado {new Date(c.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.isActive && (
                  <button
                    onClick={() => copy(c.code)}
                    className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    title="Copiar codigo"
                  >
                    {copied === c.code
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      : <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    }
                  </button>
                )}
                {c.isActive && (
                  <button
                    onClick={() => setQrFor(c.id)}
                    className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    title="Ver QR"
                  >
                    <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                )}
                {c.isActive && (
                  <button
                    onClick={() => deactivate(c.id)}
                    className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-red-500/10 flex items-center justify-center transition-colors group"
                    title="Desactivar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {qrFor && <QrModal codeId={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  )
}
