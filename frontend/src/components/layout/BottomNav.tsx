import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, Newspaper, UserCircle, Scissors, KeyRound,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const barberNav = [
  { to: '/barberia/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/barberia/appointments', icon: Calendar, label: 'Citas' },
  { to: '/barberia/clients', icon: Users, label: 'Clientes' },
  { to: '/barberia/posts', icon: Newspaper, label: 'Posts' },
  { to: '/barberia/profile', icon: UserCircle, label: 'Perfil' },
]

const customerNav = [
  { to: '/user/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/user/appointments', icon: Calendar, label: 'Citas' },
  { to: '/user/posts', icon: Newspaper, label: 'Posts' },
  { to: '/user/barbershop-code', icon: KeyRound, label: 'Codigo' },
  { to: '/user/profile', icon: UserCircle, label: 'Perfil' },
]

export function BottomNav() {
  const { user } = useAuth()
  const nav = user?.role === 'Barber' ? barberNav : customerNav

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegacion principal"
    >
      <div className="grid grid-cols-5 h-16">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                isActive ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        {nav.length < 5 && (
          <div className="flex flex-col items-center justify-center gap-1 text-zinc-700">
            <Scissors size={20} />
            <span className="text-[10px] leading-none">BarberOS</span>
          </div>
        )}
      </div>
    </nav>
  )
}
