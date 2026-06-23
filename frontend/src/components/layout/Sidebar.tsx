import { NavLink, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Scissors, Users, Calendar, LogOut, UserCheck, Key, Newspaper, Settings, KeyRound, UserCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBrandLogo } from '@/hooks/useBrandLogo'

const barberNav = [
  { to: '/barberia/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/barberia/appointments', icon: Calendar, label: 'Citas' },
  { to: '/barberia/clients', icon: Users, label: 'Clientes' },
  { to: '/barberia/barbers', icon: UserCheck, label: 'Equipo' },
  { to: '/barberia/posts', icon: Newspaper, label: 'Novedades' },
  { to: '/barberia/invitation-codes', icon: Key, label: 'Codigos' },
  { to: '/barberia/services', icon: Scissors, label: 'Servicios' },
  { to: '/barberia/settings', icon: Settings, label: 'Ajustes' },
  { to: '/barberia/profile', icon: UserCircle, label: 'Mi perfil' },
]

const customerNav = [
  { to: '/user/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/user/appointments', icon: Calendar, label: 'Mis citas' },
  { to: '/user/posts', icon: Newspaper, label: 'Novedades' },
  { to: '/user/barbershop-code', icon: KeyRound, label: 'Codigo barberia' },
  { to: '/user/profile', icon: UserCircle, label: 'Mi perfil' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const nav = user?.role === 'Barber' ? barberNav : customerNav
  const logoUrl = useBrandLogo()

  return (
    <motion.aside
      className="hidden md:flex flex-col w-64 h-screen bg-zinc-950 border-r border-zinc-800 fixed left-0 top-0 z-40"
      initial={{ x: -64, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo — barbero: su propio logo si lo subió, si no el de BarberOS; cliente: siempre el de BarberOS */}
      <Link to={user?.role === 'Barber' ? '/barberia/dashboard' : '/user/dashboard'} className="flex items-center gap-2.5 px-6 py-5 border-b border-zinc-800">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-lg shadow-black/40" />
        ) : (
          <div className="w-9 h-9 rounded-xl overflow-hidden flex shrink-0 shadow-lg shadow-black/40">
            <div className="w-1/2 bg-red-600 flex items-center justify-center">
              <Scissors size={16} className="text-white" style={{ marginRight: -8 }} />
            </div>
            <div className="w-1/2 bg-blue-600" />
          </div>
        )}
        <span className="font-black text-xl text-white">Barber<span className="text-red-600">OS</span></span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${isActive
                ? 'bg-red-600/15 text-red-500 border border-red-600/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2">
          <div className="w-8 h-8 rounded-full bg-red-600 ring-2 ring-blue-600/30 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.[0] ?? user?.fullName?.[0] ?? '?'
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{user?.displayName || user?.fullName}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Cerrar sesion
        </button>
      </div>
    </motion.aside>
  )
}
