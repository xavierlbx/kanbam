import { createRouter, createWebHistory } from 'vue-router'
import AuthPage from '../views/AuthPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import KanbamPage from '@/views/KanbamPage.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: AuthPage,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },
    {
      path: '/kanbam',
      name: 'kanbam',
      component: KanbamPage,
      meta: { requiresAuth: true },
    },
  ],
})

let sessionHydrated = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!sessionHydrated) {
    await authStore.hydrateSession()
    sessionHydrated = true
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (authStore.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    return { name: 'kanbam' }
  }

  return true
})

export default router
