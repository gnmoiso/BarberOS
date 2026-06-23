import { api } from './api'
import type { AuthTokens, LoginRequest, RegisterBarberRequest, RegisterCustomerRequest, MyTenant } from '@/types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthTokens>('/auth/login', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken }).then(r => r.data),

  registerBarber: (data: RegisterBarberRequest) =>
    api.post<AuthTokens>('/auth/register/barber', data).then(r => r.data),

  registerCustomer: (data: RegisterCustomerRequest) =>
    api.post<AuthTokens>('/auth/register/customer', data).then(r => r.data),

  joinBarbershop: (invitationCode: string) =>
    api.post<AuthTokens>('/auth/join', { invitationCode }).then(r => r.data),

  joinBarbershopByToken: (codeId: string) =>
    api.post<AuthTokens>('/auth/join-by-token', { codeId }).then(r => r.data),

  myTenants: () =>
    api.get<MyTenant[]>('/auth/my-tenants').then(r => r.data),

  leaveTenant: (tenantId: string) =>
    api.delete<AuthTokens>(`/auth/my-tenants/${tenantId}`).then(r => r.data),

  switchTenant: (tenantId: string) =>
    api.post<AuthTokens>('/auth/switch-tenant', { tenantId }).then(r => r.data),
}
