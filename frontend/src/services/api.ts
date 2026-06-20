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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = storage.getRefreshToken()
        const tenantId = storage.getTenantId()
        if (!refreshToken || !tenantId) throw new Error('no refresh token')
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
