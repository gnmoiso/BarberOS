import { api } from './api'
import type { Barber, CreateBarberRequest, UpdateBarberRequest, WorkSchedule } from '@/types'

export const barbersService = {
  list: () => api.get<Barber[]>('/barbers').then(r => r.data),
  create: (data: CreateBarberRequest) => api.post<Barber>('/barbers', data).then(r => r.data),
  update: (id: string, data: UpdateBarberRequest) =>
    api.put<Barber>(`/barbers/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/barbers/${id}`),
  getSchedule: (id: string) => api.get<WorkSchedule[]>(`/barbers/${id}/schedule`).then(r => r.data),
  setSchedule: (id: string, schedule: WorkSchedule[]) =>
    api.put(`/barbers/${id}/schedule`, { slots: schedule }),
}
