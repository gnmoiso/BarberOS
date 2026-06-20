import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'
import type { User } from '@/types'

/** Single source of truth for "where does this user belong" — used after login and as a fallback guard. */
export function homeRouteFor(user: User | null): string {
  if (!user) return '/login'
  if (user.role === 'SuperAdmin') return '/super-admin'
  if (user.role === 'Barber' && user.licensePending) return '/contact-barberos'
  if (user.role === 'Barber') return '/barberia/dashboard'
  if (user.role === 'Customer' && !user.tenantId) return '/join'
  return '/user/dashboard'
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) return <Navigate to={homeRouteFor(user)} replace />
  return <>{children}</>
}

export function RequireLicense({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.role === 'SuperAdmin') return <Navigate to="/super-admin" replace />
  if (user?.role === 'Barber' && user.licensePending) return <Navigate to="/contact-barberos" replace />
  return <>{children}</>
}
