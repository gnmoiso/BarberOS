import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** Consistent "volver" affordance for every page — goes to the actual previous screen when
 * there's browser history to go back to (e.g. arrived via a link inside the app), otherwise
 * falls back to a sensible default (Home for public pages, the dashboard for app pages). */
export function BackButton({ fallback = '/', label = 'Volver', className = '' }: { fallback?: string; label?: string; className?: string }) {
  const navigate = useNavigate()

  function handleClick() {
    if (window.history.length > 2) navigate(-1)
    else navigate(fallback)
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors ${className}`}
    >
      <ChevronLeft className="w-4 h-4" /> {label}
    </button>
  )
}
