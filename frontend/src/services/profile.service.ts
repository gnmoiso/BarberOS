import { api } from './api'
import type { ChangePasswordRequest, MyProfile, UpdateProfileRequest } from '@/types'

export const profileService = {
  get: () => api.get<MyProfile>('/auth/profile').then(r => r.data),
  update: (data: UpdateProfileRequest) => api.put('/auth/profile', data),
  changePassword: (data: ChangePasswordRequest) => api.post('/auth/change-password', data),
  updateAvatar: (avatarUrl: string) => api.put('/auth/profile/avatar', { avatarUrl }),
}
