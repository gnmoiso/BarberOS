import { useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

/** Fired after a successful logo upload/removal so every mounted Sidebar/MobileTopBar
 * refetches immediately, instead of only picking it up on the next full page load. */
export const BRAND_LOGO_UPDATED_EVENT = 'brand-logo-updated'

export function notifyBrandLogoUpdated() {
  window.dispatchEvent(new Event(BRAND_LOGO_UPDATED_EVENT))
}

/**
 * Resolves which logo the app shell (Sidebar, MobileTopBar) should show:
 * - Barbero: su propio logo de barbería si lo subió; si no, el logo de BarberOS subido por el
 *   dueño de la plataforma (SuperAdmin); si tampoco existe, null (se usa el ícono genérico).
 * - Cliente: siempre el logo de BarberOS subido por el dueño — nunca el de una barbería
 *   específica, porque un cliente puede pertenecer a varias.
 */
export function useBrandLogo(): string | null {
  const { user } = useAuth()
  const [platformLogoUrl, setPlatformLogoUrl] = useState<string | null>(null)
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null)

  const fetchPlatformLogo = useCallback(() => {
    api.get('/public/platform-settings').then(r => setPlatformLogoUrl(r.data?.logoUrl ?? null)).catch(() => {})
  }, [])

  const fetchTenantLogo = useCallback(() => {
    if (user?.role !== 'Barber') { setTenantLogoUrl(null); return }
    api.get('/barbership-settings').then(r => setTenantLogoUrl(r.data?.logoUrl ?? null)).catch(() => {})
  }, [user?.role])

  useEffect(fetchPlatformLogo, [fetchPlatformLogo])
  useEffect(fetchTenantLogo, [fetchTenantLogo, user?.tenantId])

  useEffect(() => {
    function onUpdated() { fetchPlatformLogo(); fetchTenantLogo() }
    window.addEventListener(BRAND_LOGO_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(BRAND_LOGO_UPDATED_EVENT, onUpdated)
  }, [fetchPlatformLogo, fetchTenantLogo])

  return user?.role === 'Barber' ? (tenantLogoUrl ?? platformLogoUrl) : platformLogoUrl
}
