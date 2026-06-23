import { useState, useEffect } from 'react'
import { KeyRound, Building2, ArrowRight, Check, QrCode, Trash2 } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirm } from '@/contexts/ConfirmContext'
import { QrCodeReader, extractInviteToken } from '@/components/QrCodeReader'
import { JoinSuccessOverlay } from '@/components/JoinSuccessOverlay'
import { BackButton } from '@/components/shared/BackButton'
import type { MyTenant } from '@/types'

const statusLabel: Record<string, { label: string; cls: string }> = {
  Active: { label: 'Activa', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  PendingLicense: { label: 'Pendiente de licencia', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  Suspended: { label: 'Suspendida', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

export default function BarbershopCodePage() {
  const { user, setTokens } = useAuth()
  const confirmDialog = useConfirm()
  const [tab, setTab] = useState<'code' | 'qr'>('code')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joinedTenant, setJoinedTenant] = useState<string | null>(null)
  const [tenants, setTenants] = useState<MyTenant[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [leavingId, setLeavingId] = useState<string | null>(null)

  function loadTenants() {
    setTenantsLoading(true)
    authService.myTenants().then(setTenants).catch(() => {}).finally(() => setTenantsLoading(false))
  }

  useEffect(() => { loadTenants() }, [])

  async function leaveTenant(t: MyTenant) {
    if (!await confirmDialog(`¿Eliminar ${t.name} de tus barberías vinculadas?`, { confirmLabel: 'Eliminar' })) return
    setLeavingId(t.tenantId)
    try {
      const tokens = await authService.leaveTenant(t.tenantId)
      setTokens(tokens)
      loadTenants()
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'No se pudo eliminar la barbería')
    } finally {
      setLeavingId(null)
    }
  }

  // Auto-dismiss so the celebration doesn't strand someone who never taps "Continuar".
  useEffect(() => {
    if (!joinedTenant) return
    const t = setTimeout(() => setJoinedTenant(null), 3500)
    return () => clearTimeout(t)
  }, [joinedTenant])

  async function join(call: () => Promise<Awaited<ReturnType<typeof authService.joinBarbershop>>>) {
    setError(''); setLoading(true)
    try {
      const tokens = await call()
      setTokens(tokens)
      setCode('')
      loadTenants()
      setJoinedTenant(tokens.tenantName ?? 'tu nueva barbería')
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'Código inválido, inactivo o ya vinculado')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 10) return
    await join(() => authService.joinBarbershop(code))
  }

  function handleScan(payload: string) {
    const token = extractInviteToken(payload)
    if (!token) {
      setError('El QR escaneado no es un código de invitación válido.')
      return
    }
    join(() => authService.joinBarbershopByToken(token))
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <BackButton fallback="/user/dashboard" />
      <div>
        <h1 className="text-2xl font-black text-white">Codigo de barberia</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Sincroniza tu cuenta con una nueva barberia usando el codigo de invitacion de 10 caracteres
        </p>
      </div>

      {/* 23.16.1/23.16.2 — lista completa de TODAS las barberías vinculadas, distinguiendo
          claramente cuál es la activa, en vez de mostrar solo la última a la que se unió. */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-sm">Mis barberías vinculadas</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{tenants.length} barbería{tenants.length !== 1 ? 's' : ''} asociada{tenants.length !== 1 ? 's' : ''} a tu cuenta</p>
        </div>
        {tenantsLoading ? (
          <p className="text-zinc-600 text-sm text-center py-6">Cargando...</p>
        ) : tenants.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-6">Aún no estás vinculado a ninguna barbería</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {tenants.map(t => {
              const isActive = t.tenantId === user?.tenantId
              return (
                <div key={t.tenantId} className="px-5 py-3.5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-red-600/15' : 'bg-zinc-800'}`}>
                    <Building2 className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-zinc-500'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm truncate">{t.name}</p>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
                          <Check className="w-3 h-3" /> Activa
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs">/{t.slug}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-1 rounded-lg border ${statusLabel[t.status]?.cls ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {statusLabel[t.status]?.label ?? t.status}
                  </span>
                  <button
                    onClick={() => leaveTenant(t)}
                    disabled={leavingId === t.tenantId}
                    title="Eliminar barbería"
                    className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-red-500/10 disabled:opacity-50 flex items-center justify-center transition-colors group shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-red-600" />
          <h2 className="text-white font-bold text-sm">Vincular nueva barberia</h2>
        </div>

        <div className="flex gap-2 bg-zinc-800 border border-zinc-700 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === 'code' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <KeyRound className="w-4 h-4" />
            Código
          </button>
          <button
            type="button"
            onClick={() => setTab('qr')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === 'qr' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <QrCode className="w-4 h-4" />
            Escanear QR
          </button>
        </div>

        {tab === 'code' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={10}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white text-center text-xl font-mono tracking-[0.3em] placeholder-zinc-600 focus:outline-none focus:border-red-600"
              placeholder="XXXXXXXXXX"
              required
            />
            <p className="text-zinc-600 text-xs text-center">{code.length}/10 caracteres</p>

            <button
              type="submit"
              disabled={loading || code.length !== 10}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Verificando...' : 'Sincronizar barberia'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <QrCodeReader onDecode={handleScan} />
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      {joinedTenant && (
        <JoinSuccessOverlay tenantName={joinedTenant} onContinue={() => setJoinedTenant(null)} />
      )}
    </div>
  )
}
