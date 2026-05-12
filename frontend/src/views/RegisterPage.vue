<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import axios, { AxiosError } from 'axios'

import AuthLayout from '@/components/AuthLayout.vue'
import AuthHeader from '@/components/AuthHeader.vue'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

type RegisterResponse = {
  accessToken: string
  user: {
    id: number
    name: string
    email: string
    createdAt: string
    updatedAt: string
  }
}

type RegisterPayload = {
  name: string
  email: string
  password: string
}

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successModalVisible = ref(false)
const createdUserName = ref('')

const handleRegister = async () => {
  errorMessage.value = ''

  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Por favor, preencha todos os campos.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas nao coincidem.'
    return
  }

  loading.value = true

  try {
    const payload: RegisterPayload = {
      name: name.value,
      email: email.value,
      password: password.value,
    }

    const { data } = await axios.post<RegisterResponse>(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/auth/register`,
      payload,
    )

    createdUserName.value = data.user.name
    successModalVisible.value = true

    name.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (error) {
    const message =
      (error as AxiosError<{ message: string[] }>).response?.data?.message[0] ||
      'Ocorreu um erro ao criar a conta. Tente novamente.'

    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

const goToLogin = async () => {
  successModalVisible.value = false
  await router.push('/')
}
</script>

<template>
  <AuthLayout>
    <AuthHeader headerText="Cadastrar" />

    <p class="auth-form-preText">Crie sua conta para continuar</p>

    <form class="auth-form" @submit.prevent="handleRegister">
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-user"></i>
        </InputGroupAddon>
        <InputText class="input-form" v-model="name" placeholder="Nome completo" />
      </InputGroup>

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

      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-lock"></i>
        </InputGroupAddon>
        <Password
          class="input-form"
          v-model="confirmPassword"
          placeholder="Confirmar Senha"
          :feedback="false"
          toggle-mask
        />
      </InputGroup>

      <Button
        type="submit"
        label="Criar"
        icon="pi pi-arrow-right"
        icon-pos="right"
        :loading="loading"
        fluid
      />

      <small v-if="errorMessage" class="error-message">{{ errorMessage }}</small>
    </form>

    <div class="divider"><span>ou</span></div>

    <p class="switch-text">
      Já possui uma conta?
      <a class="switch-link" @click="router.push('/')">Entre aqui</a>
    </p>

    <Dialog
      v-model:visible="successModalVisible"
      modal
      :closable="false"
      :draggable="false"
      header="Cadastro concluido"
      class="success-dialog"
    >
      <p class="success-message">Usuario {{ createdUserName }} criado com sucesso.</p>

      <template #footer>
        <Button label="Ir para login" icon="pi pi-sign-in" @click="goToLogin" autofocus />
      </template>
    </Dialog>
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

.success-message {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: #374151;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .form-panel {
    width: 100%;
  }
}
</style>
