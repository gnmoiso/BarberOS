import { api } from './api'

export interface Client {
  id: string
  userId: string
  fullName: string
  email: string
  phone?: string
  isPreferred: boolean
  penaltyPercentage: number
  joinedAt: string | null
}

export const clientsService = {
  list: () => api.get<Client[]>('/clients').then(r => r.data),
}
