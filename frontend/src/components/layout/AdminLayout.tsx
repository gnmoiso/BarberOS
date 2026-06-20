import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileTopBar } from './MobileTopBar'
import { BarbershopSwitcher } from '@/components/shared/BarbershopSwitcher'

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <MobileTopBar />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
            {/* Global active-barbershop context (23.14.6) — switching reloads the whole app so
                every tenant-scoped screen (citas, historial, horarios, servicios, calificaciones)
                re-fetches under the newly selected tenant. Self-hides for non-customers / single tenant. */}
            <BarbershopSwitcher />
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
