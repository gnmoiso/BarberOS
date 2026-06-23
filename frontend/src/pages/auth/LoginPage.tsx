import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Scissors, Eye, EyeOff, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { homeRouteFor } from '@/components/shared/RouteGuard'
import { BrandLink } from '@/components/shared/BrandLink'
import { BackButton } from '@/components/shared/BackButton'
import { api } from '@/services/api'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

interface Testimonial {
  id: string
  content: string
  authorName: string
  barbershipName: string
}

function Logo({ size = 9, logoUrl }: { size?: number; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        className="rounded-xl overflow-hidden shrink-0 shadow-lg shadow-black/40 object-cover"
        style={{ width: size * 4, height: size * 4 }}
      />
    )
  }
  return (
    <div className="rounded-xl overflow-hidden flex shrink-0 shadow-lg shadow-black/40" style={{ width: size * 4, height: size * 4 }}>
      <div className="w-1/2 bg-red-600 flex items-center justify-center">
        <Scissors size={size * 1.8} className="text-white" style={{ marginRight: -size * 0.9 }} />
      </div>
      <div className="w-1/2 bg-blue-600" />
    </div>
  )
}

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Keep the search string (e.g. ?token=... from a QR/invite deep link) so redirecting
  // back after login doesn't strip it.
  const fromLocation = (location.state as { from?: { pathname: string; search?: string } })?.from
  const from = fromLocation && `${fromLocation.pathname}${fromLocation.search ?? ''}`

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [platformLogoUrl, setPlatformLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    api.get('/testimonials/login').then(r => {
      if (r.data?.length) setTestimonials(r.data)
    }).catch(() => {})
    api.get('/public/platform-settings').then(r => setPlatformLogoUrl(r.data?.logoUrl ?? null)).catch(() => {})
  }, [])

  useEffect(() => {
    if (testimonials.length < 2) return
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % testimonials.length), 6000)
    return () => clearInterval(t)
  }, [testimonials])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const user = await login({ email: form.email, password: form.password })
      const target = homeRouteFor(user)
      const sameSection = from && from !== '/login' && from.split('/')[1] === target.split('/')[1]
      navigate(sameSection ? from : target, { replace: true })
    } catch (err) {
      const ae = err as AxiosError<ApiError>
      setError(ae.response?.data?.title ?? 'Email o contraseña incorrectos')
    }
  }

  const quote = testimonials[quoteIdx]
  const fallbackQuote = {
    content: 'Desde que uso BarberOS, mis citas están organizadas y mis clientes llegan puntuales. Es como tener un recepcionista 24/7.',
    authorName: 'Carlos Mendoza',
    barbershipName: 'Barbería El Clásico',
  }

  const displayQuote = quote ?? fallbackQuote

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden bg-gradient-to-br from-zinc-900 to-[#0A0A0A] border-r border-zinc-800">
        {/* Barber pole stripe */}
        <div className="absolute top-0 right-0 bottom-0 w-6 opacity-20">
          {[...Array(30)].map((_, i) => (
            <div key={i} className={`h-8 ${i % 3 === 0 ? 'bg-red-600' : i % 3 === 1 ? 'bg-white' : 'bg-blue-600'}`} />
          ))}
        </div>

        {/* Scissors pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <Scissors
              key={i}
              className="absolute text-red-600"
              style={{
                width: 60 + i * 20,
                top: `${10 + i * 15}%`,
                left: `${5 + (i % 3) * 30}%`,
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>

        <div className="p-12 relative z-10">
          <BrandLink className="flex items-center gap-2.5">
            <Logo size={9} logoUrl={platformLogoUrl} />
            <span className="font-black text-xl">Barber<span className="text-red-600">OS</span></span>
          </BrandLink>
        </div>

        <div className="p-12 relative z-10">
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="text-blue-500 fill-blue-500" />
            ))}
          </div>
          <blockquote
            key={quoteIdx}
            className="text-xl font-light text-zinc-200 leading-relaxed mb-6 italic"
          >
            "{displayQuote.content}"
          </blockquote>
          <div>
            <p className="text-sm font-bold text-white">{displayQuote.authorName}</p>
            <p className="text-xs text-zinc-500">{displayQuote.barbershipName}</p>
          </div>

          {testimonials.length > 1 && (
            <div className="flex gap-1.5 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuoteIdx(i)}
                  className={`h-1 rounded-full transition-all ${i === quoteIdx ? 'w-6 bg-red-600' : 'w-2 bg-zinc-600'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-12 relative z-10">
          <p className="text-xs text-zinc-700">© 2026 BarberOS. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <BrandLink className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8 lg:hidden">
            <Logo size={6} logoUrl={platformLogoUrl} />
            <span className="font-black">Barber<span className="text-red-600">OS</span></span>
          </BrandLink>

          <BackButton fallback="/" className="mb-6" />

          <h1 className="text-3xl font-black text-white mb-1">Bienvenido</h1>
          <p className="text-zinc-400 text-sm mb-8">Ingresa a tu panel de BarberOS</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-zinc-400 font-medium">Contraseña</label>
                <Link to="/forgot-password" className="text-xs text-red-500 hover:text-red-400 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
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
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-black py-3.5 rounded-xl transition-colors text-base mt-2"
            >
              {isLoading ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 mt-8">
            ¿Primera vez?{' '}
            <Link to="/register" className="text-red-500 hover:text-red-400 font-semibold transition-colors">
              Crear cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
