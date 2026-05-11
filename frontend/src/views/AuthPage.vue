<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}
</script>

<template>
  <div class="auth-page">
    <div class="form-panel">
      <div class="form-container">
        <div class="form-header">
          <div class="form-header-logo-container">
            <div class="brand-logo"><i class="pi pi-th-large" /></div>
            <h1 class="form-header-text">Login</h1>
          </div>

          <p>Faça o login para continuar no Kanbam</p>
        </div>

        <form class="auth-form" @submit.prevent="handleLogin">
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-envelope"></i>
            </InputGroupAddon>
            <InputText class="input-form" v-model="email" placeholder="E-mail" />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-lock"></i>
            </InputGroupAddon>
            <Password
              class="input-form"
              v-model="password"
              placeholder="Senha"
              :feedback="false"
              toggle-mask
            />
          </InputGroup>

          <Button
            type="submit"
            label="Sign In"
            icon="pi pi-arrow-right"
            icon-pos="right"
            :loading="loading"
            fluid
          />
        </form>

        <div class="divider"><span>or</span></div>

        <p class="switch-text">
          Não possui uma conta?
          <a class="switch-link" @click="router.push('/register')">Crie uma</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Page layout ── */
.auth-page {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Form panel ── */
.form-panel {
  flex: 1;
  flex-shrink: 0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  background: linear-gradient(145deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%);
}

.form-container {
  width: 100%;
  max-width: 360px;
  background-color: white;
  padding: 2rem;
  border-radius: 2rem;
}

.form-header {
  flex: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
}

.form-header-logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo {
  width: 47px;
  height: 47px;
  background: #8b5cf6;
  backdrop-filter: blur(6px);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo .pi {
  font-size: 1.55rem;
  color: #fff;
}

.form-header-text {
  font-size: 3rem;
  font-weight: 800;
  color: #8b5cf6;
  margin: 0 0 0.4rem;
  letter-spacing: +0.2px;
}

.form-header h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.4rem;
  letter-spacing: -0.5px;
}

.form-header p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: #d1d5db;
  font-size: 0.8rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  color: #9ca3af;
}

.switch-text {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.switch-link {
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.switch-link:hover {
  text-decoration: underline;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .brand-panel {
    display: none;
  }

  .form-panel {
    width: 100%;
  }
}
</style>
