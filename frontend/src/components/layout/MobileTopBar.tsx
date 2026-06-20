import { Scissors, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function MobileTopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="md:hidden sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex shrink-0">
          <div className="w-1/2 bg-red-600 flex items-center justify-center">
            <Scissors size={12} className="text-white" style={{ marginRight: -6 }} />
          </div>
          <div className="w-1/2 bg-blue-600" />
        </div>
        <span className="font-black text-base text-white">Barber<span className="text-red-600">OS</span></span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-red-600 ring-2 ring-blue-600/30 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user?.displayName?.[0] ?? user?.fullName?.[0] ?? '?')}
        </div>
        <button
          onClick={logout}
          aria-label="Cerrar sesion"
          className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
