import { useState, useCallback } from 'react'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export function useApi<T>(fn: (...args: unknown[]) => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (...args: unknown[]) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fn(...args)
        setData(result)
        return result
      } catch (err) {
        const axiosErr = err as AxiosError<ApiError>
        const msg = axiosErr.response?.data?.title ?? 'Error inesperado'
        setError(msg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fn]
  )

  return { data, isLoading, error, execute }
}
