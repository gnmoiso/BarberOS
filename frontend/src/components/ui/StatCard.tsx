import type { ComponentType } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface StatCardProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
  accent: string
  onToggleVisibility?: () => void
  visible?: boolean
}

/**
 * Tarjeta de estadística compartida por los dashboards (barbero, cliente, SuperAdmin).
 *
 * 23.20.13 — la primera corrección (min-w-0 + permitir salto de línea) no bastó: con 3 columnas
 * en 380px el ícono solo ya consume casi todo el ancho de la tarjeta, dejando ~26px para el
 * texto — insuficiente incluso partiendo la palabra en dos líneas. La solución real es no
 * competir por el ancho: en pantallas angostas el ícono va arriba, centrado, y el texto abajo
 * a todo el ancho de la tarjeta; desde `sm:` se recupera el layout horizontal (icono + texto
 * lado a lado) porque ahí ya hay espacio de sobra.
 */
export function StatCard({ icon: Icon, label, value, accent, onToggleVisibility, visible = true }: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 relative min-w-0 text-center sm:text-left">
      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
      <div className="min-w-0 w-full sm:flex-1">
        <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-white text-lg sm:text-2xl font-black mt-0.5 truncate">{visible ? value : '••••••'}</p>
      </div>
      {onToggleVisibility && (
        <button
          onClick={onToggleVisibility}
          title={visible ? 'Ocultar' : 'Mostrar'}
          className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 text-zinc-600 hover:text-zinc-300 transition-colors p-1 shrink-0"
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}
