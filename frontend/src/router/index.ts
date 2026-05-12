import { createRouter, createWebHistory } from 'vue-router'
import AuthPage from '../views/AuthPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import KanbamPage from '@/views/KanbamPage.vue'

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

router.beforeEach((to) => {
  const accessToken = localStorage.getItem('accessToken')
  const isAuthenticated = Boolean(accessToken)

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { path: '/' }
  }

  if (isAuthenticated && (to.path === '/' || to.path === '/register')) {
    return { path: '/kanbam' }
  }

  return true
})

export default router
