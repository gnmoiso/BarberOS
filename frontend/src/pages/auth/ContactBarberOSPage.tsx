import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Phone, Mail, MessageCircle, KeyRound, ArrowRight } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface PlatformSettings {
  contactPhone?: string
  contactEmail?: string
  contactWhatsApp?: string
  contactMessage?: string
}

export default function ContactBarberOSPage() {
  const { user, refreshLicenseStatus } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [licenseCode, setLicenseCode] = useState('')
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/super-admin/platform-settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!licenseCode.trim()) return
    setActivating(true); setError(null)
    try {
      await api.post('/auth/activate-license', { licenseCode: licenseCode.trim().toUpperCase() })
      refreshLicenseStatus()
      navigate('/barberia/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'Código de licencia inválido o vencido')
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scissors className="text-red-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            ¡Bienvenido, {user?.fullName}!
          </h1>
          <p className="text-zinc-400 text-lg">
            Tu cuenta fue creada con éxito. Para activar tu barbería en la plataforma, contáctanos.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6">
          {settings?.contactMessage && (
            <p className="text-zinc-300 mb-6">{settings.contactMessage}</p>
          )}

          <div className="space-y-4">
            {settings?.contactWhatsApp && (
              <a
                href={`https://wa.me/${settings.contactWhatsApp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 hover:border-green-500 rounded-xl px-5 py-4 text-green-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">WhatsApp: {settings.contactWhatsApp}</span>
              </a>
            )}

            {settings?.contactPhone && (
              <a
                href={`tel:${settings.contactPhone}`}
                className="flex items-center gap-3 bg-red-600/10 border border-red-600/30 hover:border-red-600 rounded-xl px-5 py-4 text-red-500 transition-colors"
              >
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Teléfono: {settings.contactPhone}</span>
              </a>
            )}

            {settings?.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 hover:border-blue-500 rounded-xl px-5 py-4 text-blue-400 transition-colors"
              >
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{settings.contactEmail}</span>
              </a>
            )}

            {settings && !settings.contactWhatsApp && !settings.contactPhone && !settings.contactEmail && (
              <p className="text-zinc-500 py-4">
                El equipo de BarberOS aún no configuró un medio de contacto. Vuelve a intentarlo más tarde.
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-red-600/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 justify-center mb-4">
            <KeyRound className="text-red-600 w-5 h-5" />
            <h2 className="text-white font-bold text-lg">Activar licencia</h2>
          </div>
          <p className="text-zinc-400 text-sm mb-5">
            Si ya recibiste tu código de licencia de BarberOS, ingrésalo aquí para desbloquear el panel completo.
          </p>
          <form onSubmit={handleActivate} className="space-y-3">
            <input
              type="text"
              value={licenseCode}
              onChange={e => setLicenseCode(e.target.value.toUpperCase())}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-mono tracking-widest text-center"
              placeholder="XXXXXXXX"
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={activating}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {activating ? 'Activando...' : 'Activar barbería'}
              {!activating && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-zinc-600 text-sm mt-6">
          Una vez que tu barbería esté activa, podrás acceder al panel de administración completo.
        </p>
      </div>
    </div>
  )
}
