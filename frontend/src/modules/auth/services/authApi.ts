import axios from 'axios'
import type { AuthResponse, AuthUser } from '@/types/auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const authApi = {
  login(email: string, password: string) {
    return axios.post<AuthResponse>(`${BASE_URL}/api/auth/login`, { email, password })
  },

  register(name: string, email: string, password: string) {
    return axios.post<AuthResponse>(`${BASE_URL}/api/auth/register`, { name, email, password })
  },

  me(token: string) {
    return axios.get<AuthUser>(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
