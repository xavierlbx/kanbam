import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/modules/auth/services/authApi'
import type { AuthUser } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  async function login(email: string, password: string): Promise<void> {
    const { data } = await authApi.login(email, password)
    persistSession(data.accessToken, data.user)
  }

  async function register(name: string, email: string, password: string): Promise<string> {
    const { data } = await authApi.register(name, email, password)
    return data.user.name
  }

  function logout(): void {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  async function hydrateSession(): Promise<void> {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    try {
      const { data } = await authApi.me(token)
      accessToken.value = token
      user.value = data
    } catch {
      logout()
    }
  }
/* Função para persistir a sessão do usuário */
  function persistSession(token: string, userData: AuthUser): void {
    accessToken.value = token
    user.value = userData
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  return { accessToken, user, isAuthenticated, login, register, logout, hydrateSession }
})
