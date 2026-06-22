import { useEffect } from 'react'
import { api } from '@/services/api'

/** 23.20.11 — favicon generado automáticamente desde el logo de la plataforma subido por
 * SuperAdmin (sin necesitar una carga de favicon separada); cae al SVG por defecto si no hay logo. */
export function useFavicon() {
  useEffect(() => {
    api.get('/public/platform-settings').then(r => {
      const logoUrl = r.data?.logoUrl
      if (!logoUrl) return
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (link) link.href = logoUrl
    }).catch(() => {})
  }, [])
}
