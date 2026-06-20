import { api } from './api'
import type { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types'

export const servicesService = {
  list: () => api.get<Service[]>('/services').then(r => r.data),
  create: (data: CreateServiceRequest) => api.post<Service>('/services', data).then(r => r.data),
  update: (id: string, data: UpdateServiceRequest) =>
    api.put<Service>(`/services/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/services/${id}`),
}
