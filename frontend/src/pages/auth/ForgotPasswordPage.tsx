import { useEffect, useState } from 'react'
import { KeyRound, Phone, Mail, MessageCircle } from 'lucide-react'
import { api } from '@/services/api'
import { BrandLink } from '@/components/shared/BrandLink'
import { BackButton } from '@/components/shared/BackButton'

interface PlatformSettings {
  contactPhone?: string
  contactEmail?: string
  contactWhatsApp?: string
}

/** BarberOS has no outbound-email infra yet, so "forgot password" can't be a
 * self-service email link — it routes to the same human contact channels
 * ContactBarberOSPage uses, where BarberOS support can reset the account via
 * the SuperAdmin panel. */
export default function ForgotPasswordPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)

  useEffect(() => {
    api.get('/super-admin/platform-settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BackButton fallback="/login" label="Volver a iniciar sesión" className="mb-6" />

        <div className="text-center mb-8">
          <BrandLink className="inline-block">
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="text-red-600 w-8 h-8" />
            </div>
          </BrandLink>
          <h1 className="text-2xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-zinc-400 text-sm">
            Por ahora la recuperación se hace por contacto directo — escríbenos y te ayudamos a restablecerla.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          {settings?.contactWhatsApp && (
            <a
              href={`https://wa.me/${settings.contactWhatsApp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 hover:border-green-500 rounded-xl px-5 py-4 text-green-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">WhatsApp: {settings.contactWhatsApp}</span>
            </a>
          )}
          {settings?.contactPhone && (
            <a
              href={`tel:${settings.contactPhone}`}
              className="flex items-center gap-3 bg-red-600/10 border border-red-600/30 hover:border-red-600 rounded-xl px-5 py-4 text-red-500 transition-colors"
            >
              <Phone className="w-5 h-5 shrink-0" />
              <span className="font-medium">Teléfono: {settings.contactPhone}</span>
            </a>
          )}
          {settings?.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 hover:border-blue-500 rounded-xl px-5 py-4 text-blue-400 transition-colors"
            >
              <Mail className="w-5 h-5 shrink-0" />
              <span className="font-medium">{settings.contactEmail}</span>
            </a>
          )}
          {settings && !settings.contactWhatsApp && !settings.contactPhone && !settings.contactEmail && (
            <p className="text-zinc-500 text-sm text-center py-4">
              El equipo de BarberOS aún no configuró un medio de contacto. Vuelve a intentarlo más tarde.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
