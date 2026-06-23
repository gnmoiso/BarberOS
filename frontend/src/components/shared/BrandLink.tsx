import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { homeRouteFor } from './RouteGuard'

/** Wrap the BarberOS logo/name with this everywhere it appears — clicking it goes to Home if
 * nobody's logged in, or straight to that user's own dashboard if they are. */
export function BrandLink({ children, className }: { children: ReactNode; className?: string }) {
  const { user, isAuthenticated } = useAuth()
  return (
    <Link to={isAuthenticated ? homeRouteFor(user) : '/'} className={className}>
      {children}
    </Link>
  )
}
