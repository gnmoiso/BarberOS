import { api } from './api'
import type { Customer, CreateCustomerRequest, PagedResult } from '@/types'

export const customersService = {
  list: (params?: { q?: string; page?: number; size?: number }) =>
    api.get<PagedResult<Customer>>('/customers', { params }).then(r => r.data),
  create: (data: CreateCustomerRequest) =>
    api.post<Customer>('/customers', data).then(r => r.data),
}
