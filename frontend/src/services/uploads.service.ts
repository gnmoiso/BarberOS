import { api } from './api'

export const uploadsService = {
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ url: string }>('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.url)
  },
}
