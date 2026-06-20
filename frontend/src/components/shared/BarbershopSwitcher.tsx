import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Building2, Check } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuth } from '@/contexts/AuthContext'
import type { MyTenant } from '@/types'

/** Lets a customer who belongs to several barbershops pick which one's content (Novedades, citas) they're viewing. */
export function BarbershopSwitcher() {
  const { user, setTokens } = useAuth()
  const [tenants, setTenants] = useState<MyTenant[]>([])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.role !== 'Customer') return
    authService.myTenants().then(setTenants).catch(() => {})
  }, [user?.role])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (user?.role !== 'Customer' || tenants.length < 2) return null

  const current = tenants.find(t => t.tenantId === user?.tenantId)

  async function pick(tenantId: string) {
    if (tenantId === user?.tenantId) { setOpen(false); return }
    setSwitching(true)
    try {
      const tokens = await authService.switchTenant(tenantId)
      setTokens(tokens)
      window.location.reload()
    } finally {
      setSwitching(false); setOpen(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={switching}
        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-red-600/40 rounded-xl px-3.5 py-2.5 text-sm transition-colors min-h-[44px]"
      >
        <Building2 className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-white font-medium truncate max-w-[140px]">{current?.name ?? 'Mi barbería'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 min-w-[220px] py-1.5 overflow-hidden">
          {tenants.map(t => (
            <button
              key={t.tenantId}
              onClick={() => pick(t.tenantId)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-zinc-800 transition-colors"
            >
              <span className="flex-1 truncate text-zinc-200">{t.name}</span>
              {t.tenantId === user?.tenantId && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
