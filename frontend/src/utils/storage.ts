const KEYS = {
  accessToken: 'bos_access_token',
  refreshToken: 'bos_refresh_token',
  tenantId: 'bos_tenant_id',
  user: 'bos_user',
} as const

export const storage = {
  getAccessToken: () => localStorage.getItem(KEYS.accessToken),
  setAccessToken: (t: string) => localStorage.setItem(KEYS.accessToken, t),

  getRefreshToken: () => localStorage.getItem(KEYS.refreshToken),
  setRefreshToken: (t: string) => localStorage.setItem(KEYS.refreshToken, t),

  getTenantId: () => localStorage.getItem(KEYS.tenantId),
  setTenantId: (id: string) => localStorage.setItem(KEYS.tenantId, id),

  getUser: () => {
    const raw = localStorage.getItem(KEYS.user)
    return raw ? JSON.parse(raw) : null
  },
  setUser: (u: object) => localStorage.setItem(KEYS.user, JSON.stringify(u)),

  clear: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
}
