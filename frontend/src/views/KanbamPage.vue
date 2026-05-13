<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <section class="kanbam-page">
    <header class="kanbam-header">
      <h1>Kanbam Page</h1>
      <button type="button" class="logout-button" @click="handleLogout">Logout</button>
    </header>

    <p>Welcome to the Kanbam page!</p>
  </section>
</template>

<style scoped>
.kanbam-page {
  padding: 1.5rem;
}

.kanbam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.logout-button {
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #111827;
  padding: 0.5rem 0.9rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.logout-button:hover {
  background-color: #f3f4f6;
}

</style>
