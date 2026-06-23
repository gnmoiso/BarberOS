import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Scissors, Calendar, Users, Star, ChevronRight, Shield, CheckCircle2,
  Bell, BarChart3, Quote, ArrowRight, Sparkles,
} from 'lucide-react'
import { api } from '@/services/api'
import { BrandLink } from '@/components/shared/BrandLink'

interface Testimonial {
  id: string
  content: string
  authorName: string
  barbershipName: string
}

const features = [
  { icon: Calendar, title: 'Agenda sin cruces', desc: 'Citas en tiempo real, filtradas por tus horarios y descansos. Tu barbería siempre organizada.', color: 'red', big: true },
  { icon: Users, title: 'Clientes fieles', desc: 'Historial completo, clientes preferidos y control de inasistencias.', color: 'blue' },
  { icon: Scissors, title: 'Catálogo de servicios', desc: 'Cortes, barba, cejas, lavado — precios y duraciones a tu medida.', color: 'red' },
  { icon: Star, title: 'Valoraciones reales', desc: 'Calificación anónima por servicio. Solo tú ves tu promedio.', color: 'blue' },
  { icon: Shield, title: 'Acceso por invitación', desc: 'Código único de 10 dígitos. Solo entran los clientes que tú invitas.', color: 'red' },
  { icon: Bell, title: 'Notificaciones push', desc: 'Alertas configurables antes de cada cita — en móvil y computador.', color: 'blue' },
]

const stats = [
  { value: '500+', label: 'Barberías activas' },
  { value: '12K+', label: 'Citas agendadas' },
  { value: '98%', label: 'Satisfacción' },
  { value: '24/7', label: 'Disponible siempre' },
]

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

export default function HomePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [platformLogoUrl, setPlatformLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    api.get('/testimonials/home').then(r => setTestimonials(r.data)).catch(() => {})
    api.get('/public/platform-settings').then(r => setPlatformLogoUrl(r.data?.logoUrl ?? null)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Top accent bar — the barber-pole signature */}
      <div className="fixed top-0 w-full h-[3px] z-[60] bg-gradient-to-r from-red-600 via-white to-blue-600" />

      {/* Nav */}
      <nav className="fixed top-[3px] w-full z-50 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <BrandLink className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
            <Logo size={9} logoUrl={platformLogoUrl} />
            <span className="font-black text-lg sm:text-xl tracking-tight whitespace-nowrap">Barber<span className="text-red-600">OS</span></span>
          </BrandLink>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#how" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonios</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link to="/login" className="hidden sm:inline-block text-zinc-400 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl transition-colors shadow-lg shadow-red-600/20 whitespace-nowrap">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/8 rounded-full blur-[140px]" />
          <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-full mb-7">
              <Sparkles size={13} className="text-red-500" />
              La plataforma #1 para barberías
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="text-blue-400">nuevo: notificaciones push</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black leading-[1.05] mb-6 tracking-tight">
              Tu barbería,
              <br />
              <span className="bg-gradient-to-r from-red-500 via-red-400 to-blue-500 bg-clip-text text-transparent">sin el caos</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-lg mb-9 leading-relaxed">
              Agenda citas, gestiona tu equipo y haz crecer tu barbería con la plataforma
              que entiende el oficio. Sin llamadas, sin papeles, sin excusas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-7 py-3.5 rounded-2xl text-base transition-all hover:scale-[1.03] shadow-xl shadow-red-600/20"
              >
                Empezar gratis
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-blue-500 text-white font-semibold px-7 py-3.5 rounded-2xl text-base transition-all"
              >
                Iniciar sesión
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {['red', 'blue', 'red', 'blue'].map((c, i) => (
                  <div key={i} className={`w-9 h-9 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center ${c === 'red' ? 'bg-red-600/80' : 'bg-blue-600/80'}`}>
                    <Scissors size={13} className="text-white" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-red-500 fill-red-500" />)}
                </div>
                <p className="text-xs text-zinc-500">Calificado por +500 barberías</p>
              </div>
            </div>
          </div>

          {/* Right: product mockup card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-red-600/20 via-transparent to-blue-600/20 rounded-[2rem] blur-2xl" />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-1.5 shadow-2xl shadow-black/60">
              <div className="bg-zinc-950 rounded-[1.3rem] overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="ml-auto text-[10px] text-zinc-600 font-mono">barberos.app/dashboard</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-red-600/15 rounded-lg flex items-center justify-center">
                          <Calendar size={13} className="text-red-500" />
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Citas hoy</span>
                      </div>
                      <p className="text-2xl font-black text-white">14</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-blue-600/15 rounded-lg flex items-center justify-center">
                          <BarChart3 size={13} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Ingresos</span>
                      </div>
                      <p className="text-2xl font-black text-white">$840K</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { time: '10:30', name: 'Carlos M.', svc: 'Corte + Barba' },
                      { time: '11:15', name: 'Andrés P.', svc: 'Corte clásico' },
                      { time: '12:00', name: 'Felipe R.', svc: 'Cejas + Lavado' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-3 py-2.5">
                        <span className="text-xs font-bold text-red-500 w-10">{a.time}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-zinc-200">{a.name}</p>
                          <p className="text-[10px] text-zinc-500">{a.svc}</p>
                        </div>
                        <CheckCircle2 size={14} className="text-blue-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-zinc-800/60 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <div className={`text-4xl font-black mb-1 ${i % 2 === 0 ? 'text-red-500' : 'text-blue-400'}`}>{s.value}</div>
              <div className="text-zinc-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features — bento grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Características</span>
            <h2 className="text-4xl font-black mt-3 mb-4">
              Todo lo que tu barbería
              <span className="text-red-600"> necesita</span>
            </h2>
            <p className="text-zinc-400 text-lg">Sin apps de terceros. Sin complicaciones. Todo en un solo lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 transition-all hover:bg-zinc-900 ${
                  f.big ? 'md:col-span-2 md:row-span-1' : ''
                } ${f.color === 'red' ? 'hover:border-red-600/40' : 'hover:border-blue-600/40'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${f.color === 'red' ? 'bg-red-600/10 group-hover:bg-red-600/20' : 'bg-blue-600/10 group-hover:bg-blue-600/20'}`}>
                  <f.icon className={`w-6 h-6 ${f.color === 'red' ? 'text-red-500' : 'text-blue-500'}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — connected timeline */}
      <section id="how" className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Cómo funciona</span>
            <h2 className="text-4xl font-black mt-3">Así de <span className="text-blue-500">simple</span></h2>
          </div>
          <div className="relative grid md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-red-600 via-white/20 to-blue-600" />
            {[
              { step: '01', title: 'Activa tu barbería', desc: 'Usa tu código de licencia para registrar tu barbería en minutos.', color: 'red' },
              { step: '02', title: 'Invita a tus clientes', desc: 'Comparte tu código de 10 dígitos. Solo entran quienes tú quieras.', color: 'white' },
              { step: '03', title: 'Gestiona sin estrés', desc: 'Citas, equipo, calificaciones y novedades — todo desde un panel.', color: 'blue' },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className={`w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center font-black text-sm border-2 bg-zinc-950 relative z-10 ${
                  item.color === 'red' ? 'border-red-600 text-red-500' : item.color === 'blue' ? 'border-blue-600 text-blue-400' : 'border-zinc-600 text-zinc-300'
                }`}>
                  {item.step}
                </div>
                <h3 className="text-white font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Testimonios</span>
              <h2 className="text-4xl font-black mt-3">Lo que dicen los <span className="text-red-600">barberos</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={t.id} className={`bg-zinc-900 border rounded-2xl p-6 relative ${i % 2 === 0 ? 'border-red-600/20' : 'border-blue-600/20'}`}>
                  <Quote className={`w-6 h-6 mb-3 ${i % 2 === 0 ? 'text-red-600/40' : 'text-blue-500/40'}`} />
                  <p className="text-zinc-300 text-sm leading-relaxed mb-5">"{t.content}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{t.authorName}</p>
                      <p className="text-zinc-500 text-xs">{t.barbershipName}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => <Star key={j} size={11} className="text-red-500 fill-red-500" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA — signature red-to-blue band */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative overflow-hidden rounded-[2rem] p-14 bg-gradient-to-br from-red-700 via-zinc-900 to-blue-700">
          <div className="absolute inset-0 bg-[#0A0A0A]/70" />
          <div className="relative">
            <Logo size={14} logoUrl={platformLogoUrl} />
            <h2 className="text-4xl font-black mb-4 mt-6">
              ¿Listo para transformar<br />tu barbería?
            </h2>
            <p className="text-zinc-300 mb-9">
              Únete a cientos de barberos que ya gestionan su negocio con BarberOS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-black font-black px-8 py-4 rounded-2xl transition-all hover:scale-105"
              >
                Empezar gratis <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="border border-white/30 hover:border-white text-white font-semibold px-8 py-4 rounded-2xl transition-colors"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-14 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Logo size={8} logoUrl={platformLogoUrl} />
              <span className="font-black text-lg">Barber<span className="text-red-600">OS</span></span>
            </div>
            <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
              La plataforma de gestión hecha por y para barberías. Agenda, equipo y clientes en un solo lugar.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Plataforma</p>
            <div className="flex flex-col gap-2 text-zinc-500 text-sm">
              <a href="#features" className="hover:text-red-500 transition-colors">Características</a>
              <a href="#how" className="hover:text-red-500 transition-colors">Cómo funciona</a>
              <Link to="/register" className="hover:text-red-500 transition-colors">Registro</Link>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Cuenta</p>
            <div className="flex flex-col gap-2 text-zinc-500 text-sm">
              <Link to="/login" className="hover:text-blue-400 transition-colors">Iniciar sesión</Link>
              <Link to="/register" className="hover:text-blue-400 transition-colors">Crear cuenta</Link>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-zinc-800/60 mt-10 pt-6">
          <p className="text-zinc-600 text-xs text-center">© 2026 BarberOS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
