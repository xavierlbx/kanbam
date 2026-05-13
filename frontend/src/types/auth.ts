import axios from 'axios'
import type { AxiosError } from 'axios'

export type AuthUser = {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type AuthResponse = {
  accessToken: string
  user: AuthUser
}

export type ApiValidationError = {
  message: string
  errors?: Record<string, string[]>
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const data = (error as AxiosError<ApiValidationError>).response?.data

  if (!data) return fallback

  if (data.errors) {
    const firstFieldErrors = Object.values(data.errors)[0]
    if (firstFieldErrors?.[0]) return firstFieldErrors[0]
  }

  if (typeof data.message === 'string') return data.message

  return fallback
}
