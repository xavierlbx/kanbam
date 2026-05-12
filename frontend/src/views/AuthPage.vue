<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import AuthLayout from '@/components/AuthLayout.vue'
import AuthHeader from '@/components/AuthHeader.vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

type LoginResponse = {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
  }
}

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const { data } = await axios.post<LoginResponse>(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/auth/login`,
      {
        email: email.value,
        password: password.value,
      },
    )

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))

    const postLoginPath = import.meta.env.VITE_POST_LOGIN_PATH ?? '/kanbam'
    await router.push(postLoginPath)
  } catch (error) {
    errorMessage.value = 'E-mail ou senha invalidos.'
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <AuthHeader headerText="Login" />

    <p class="auth-form-preText">Entre com suas credenciais para continuar</p>

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
        label="Entrar"
        icon="pi pi-arrow-right"
        icon-pos="right"
        :loading="loading"
        fluid
      />

      <small v-if="errorMessage" class="error-message">{{ errorMessage }}</small>
    </form>

    <div class="divider"><span>ou</span></div>

    <p class="switch-text">
      Não possui uma conta?
      <a class="switch-link" @click="router.push('/register')">Crie uma</a>
    </p>
  </AuthLayout>
</template>

<style scoped>
.auth-form-preText {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem;
  align-self: center;
  text-align: center;
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

.error-message {
  color: #dc2626;
  font-size: 0.8125rem;
  text-align: center;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .form-panel {
    width: 100%;
  }
}
</style>
