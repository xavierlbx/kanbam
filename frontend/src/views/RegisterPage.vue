<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthLayout from '@/components/AuthLayout.vue'
import AuthHeader from '@/components/AuthHeader.vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function handleRegister() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
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
    </form>

    <div class="divider"><span>ou</span></div>

    <p class="switch-text">
      Já possui uma conta?
      <a class="switch-link" @click="router.push('/')">Entre aqui</a>
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

/* ── Responsive ── */
@media (max-width: 768px) {
  .form-panel {
    width: 100%;
  }
}
</style>
