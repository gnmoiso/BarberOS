import axios from 'axios'
import { storage } from '@/utils/storage'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = storage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config

    // A license was revoked/deleted (or the tenant itself was deleted) mid-session — enforced
    // per-request on the backend, not just at next login. Bounce straight to the reactivation
    // screen instead of leaving the barber stuck on a broken/half-loaded panel.
    if (error.response?.status === 403 && error.response?.data?.errorCode === 'license.required') {
      window.location.href = '/contact-barberos'
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = storage.getRefreshToken()
      const tenantId = storage.getTenantId()
      // No session to begin with (anonymous visitor hitting some endpoint that 401s) —
      // don't force-navigate anywhere, just let the error propagate. Forcing everyone
      // to /login on any unrelated 401 was sending people away from Home/Login/Register
      // even when they were never logged in.
      if (!refreshToken || !tenantId) return Promise.reject(error)
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken, tenantId })
        storage.setAccessToken(data.accessToken)
        storage.setRefreshToken(data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        storage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
