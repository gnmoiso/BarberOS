import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { storage } from '@/utils/storage'
import type { User, LoginRequest, AuthTokens } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<User>
  logout: () => void
  setTokens: (tokens: AuthTokens) => User
  refreshLicenseStatus: () => void
  refreshProfile: () => Promise<void>
  updateUserLocal: (patch: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function tokensToUser(tokens: AuthTokens, fallback?: User | null): User {
  return {
    id: tokens.userId ?? fallback?.id ?? '',
    email: tokens.email ?? fallback?.email ?? '',
    fullName: tokens.fullName ?? fallback?.fullName ?? '',
    role: tokens.role ?? fallback?.role ?? '',
    tenantId: tokens.tenantId ?? fallback?.tenantId,
    tenantSlug: tokens.tenantSlug ?? fallback?.tenantSlug,
    licensePending: tokens.licensePending ?? fallback?.licensePending,
    displayName: fallback?.displayName,
    avatarUrl: fallback?.avatarUrl,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser())
  const [isLoading, setIsLoading] = useState(false)

  const updateUserLocal = useCallback((patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      storage.setUser(updated)
      return updated
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await profileService.get()
      updateUserLocal({
        fullName: profile.fullName,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        email: profile.email,
      })
    } catch {
      // non-fatal — profile enrichment is best-effort
    }
  }, [updateUserLocal])

  useEffect(() => {
    if (user) refreshProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const setTokens = useCallback((tokens: AuthTokens): User => {
    storage.setAccessToken(tokens.accessToken)
    storage.setRefreshToken(tokens.refreshToken)
    if (tokens.tenantId) storage.setTenantId(tokens.tenantId)
    const u = tokensToUser(tokens, storage.getUser())
    storage.setUser(u)
    setUser(u)
    return u
  }, [])

  const login = useCallback(async (data: LoginRequest): Promise<User> => {
    setIsLoading(true)
    try {
      const tokens = await authService.login(data)
      return setTokens(tokens)
    } finally {
      setIsLoading(false)
    }
  }, [setTokens])

  const logout = useCallback(() => {
    storage.clear()
    setUser(null)
  }, [])

  const refreshLicenseStatus = useCallback(() => {
    updateUserLocal({ licensePending: false })
  }, [updateUserLocal])

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, login, logout, setTokens,
      refreshLicenseStatus, refreshProfile, updateUserLocal,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
