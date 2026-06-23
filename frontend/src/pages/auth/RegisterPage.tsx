import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scissors, User, Building2, Eye, EyeOff } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuth } from '@/contexts/AuthContext'
import { sanitizePhoneInput, validatePhone } from '@/utils/phone'
import { api } from '@/services/api'

type Mode = 'select' | 'barber' | 'customer'

function BrandLogo({ logoUrl, className }: { logoUrl: string | null; className?: string }) {
  return logoUrl
    ? <img src={logoUrl} alt="Logo" className={`${className} rounded-xl object-cover`} />
    : <Scissors className={`text-red-600 ${className}`} />
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setTokens } = useAuth()
  const [mode, setMode] = useState<Mode>('select')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [platformLogoUrl, setPlatformLogoUrl] = useState<string | null>(null)
  const [testimonial, setTestimonial] = useState<{ content: string; authorName: string; barbershipName: string } | null>(null)

  useEffect(() => {
    api.get('/public/platform-settings').then(r => setPlatformLogoUrl(r.data?.logoUrl ?? null)).catch(() => {})
    api.get('/testimonials/register').then(r => { if (r.data?.length) setTestimonial(r.data[0]) }).catch(() => {})
  }, [])

  const [barberForm, setBarberForm] = useState({
    email: '', fullName: '', password: '', barbershopName: '', phone: ''
  })
  const [customerForm, setCustomerForm] = useState({
    email: '', fullName: '', password: '', phone: ''
  })

  async function handleBarberSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const phoneError = validatePhone(barberForm.phone, true)
    if (phoneError) { setError(phoneError); return }
    setLoading(true)
    try {
      const tokens = await authService.registerBarber(barberForm)
      const user = setTokens(tokens)
      if (user.role === 'Barber') navigate('/contact-barberos')
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  async function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const phoneError = validatePhone(customerForm.phone, true)
    if (phoneError) { setError(phoneError); return }
    setLoading(true)
    try {
      const tokens = await authService.registerCustomer(customerForm)
      setTokens(tokens)
      navigate('/join')
    } catch (err: any) {
      setError(err?.response?.data?.title ?? 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="text-zinc-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1.5">
            ← Volver al inicio
          </Link>
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <BrandLogo logoUrl={platformLogoUrl} className="w-8 h-8" />
              <span className="text-white font-bold text-2xl">BarberOS</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Crear cuenta</h1>
            <p className="text-zinc-400">¿Cómo quieres usar BarberOS?</p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => setMode('barber')}
              className="group relative bg-zinc-900 border border-zinc-700 hover:border-red-600 rounded-2xl p-6 text-left transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="bg-red-600/10 rounded-xl p-3 group-hover:bg-red-600/20 transition-colors">
                  <Building2 className="text-red-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Soy dueño de barbería</h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    Crea tu cuenta y luego activa tu barbería con un código de licencia de BarberOS
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('customer')}
              className="group relative bg-zinc-900 border border-zinc-700 hover:border-red-600 rounded-2xl p-6 text-left transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="bg-red-600/10 rounded-xl p-3 group-hover:bg-red-600/20 transition-colors">
                  <User className="text-red-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Soy cliente</h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    Me invitaron a una barbería con un código de invitación
                  </p>
                </div>
              </div>
            </button>
          </div>

          {testimonial && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 mt-8">
              <p className="text-zinc-300 text-sm italic leading-relaxed">"{testimonial.content}"</p>
              <p className="text-zinc-500 text-xs mt-2">— {testimonial.authorName}, {testimonial.barbershipName}</p>
            </div>
          )}

          <p className="text-center text-zinc-500 text-sm mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-red-500 hover:text-red-400">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const isBarber = mode === 'barber'

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => setMode('select')} className="text-zinc-400 hover:text-white text-sm mb-4 block mx-auto">
            ← Volver
          </button>
          <Link to="/" className="inline-block">
            <BrandLogo logoUrl={platformLogoUrl} className="w-8 h-8 mx-auto mb-3" />
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isBarber ? 'Registrar barbería' : 'Crear cuenta de cliente'}
          </h1>
        </div>

        <form onSubmit={isBarber ? handleBarberSubmit : handleCustomerSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={isBarber ? barberForm.fullName : customerForm.fullName}
              onChange={e => isBarber
                ? setBarberForm(f => ({ ...f, fullName: e.target.value }))
                : setCustomerForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
              placeholder="Tu nombre"
              required
            />
          </div>

          {isBarber && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nombre de la barbería *</label>
              <input
                type="text"
                value={barberForm.barbershopName}
                onChange={e => setBarberForm(f => ({ ...f, barbershopName: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                placeholder="Mi Barbería Premium"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Correo electrónico *</label>
            <input
              type="email"
              value={isBarber ? barberForm.email : customerForm.email}
              onChange={e => isBarber
                ? setBarberForm(f => ({ ...f, email: e.target.value }))
                : setCustomerForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Teléfono *</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={isBarber ? barberForm.phone : customerForm.phone}
              onChange={e => {
                const phone = sanitizePhoneInput(e.target.value)
                isBarber ? setBarberForm(f => ({ ...f, phone })) : setCustomerForm(f => ({ ...f, phone }))
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
              placeholder="3001234567"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Contraseña *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={isBarber ? barberForm.password : customerForm.password}
                onChange={e => isBarber
                  ? setBarberForm(f => ({ ...f, password: e.target.value }))
                  : setCustomerForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-bold py-3.5 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Creando cuenta...' : isBarber ? 'Registrar barbería' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-red-500 hover:text-red-400">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
