import axios from 'axios'
import type { AxiosError } from 'axios'

type ApiErrorData = {
  message?: string | string[]
  error?: string
  errors?: Record<string, string[]>
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const data = (error as AxiosError<ApiErrorData>).response?.data

  if (!data) return fallback

  if (data.errors) {
    const firstFieldErrors = Object.values(data.errors)[0]
    if (firstFieldErrors?.[0]) return firstFieldErrors[0]
  }

  if (Array.isArray(data.message)) {
    const firstMessage = data.message.find((item) => typeof item === 'string' && item.trim().length > 0)
    if (firstMessage) return firstMessage
  }

  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message
  }

  if (typeof data.error === 'string' && data.error.trim().length > 0) {
    return data.error
  }

  return fallback
}
