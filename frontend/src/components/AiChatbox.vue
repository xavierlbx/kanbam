<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { kanbanApi } from '@/modules/kanbam/service/kanbamApi'
import type { Column, Task } from '@/types/kanbam'
import { extractApiErrorMessage } from '@/utils/apiError'

import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const props = defineProps<{
  columns: Column[]
}>()

const emit = defineEmits<{
  'task-created': [task: Task]
}>()

const authStore = useAuthStore()

const isOpen = ref(false)
const inputMessage = ref('')
const loading = ref(false)
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    content:
      'Olá! Posso criar tarefas para você. Exemplo: "Crie uma tarefa para revisar o relatório na coluna To do".',
  },
])
const messagesContainer = ref<HTMLElement | null>(null)

let messageIdCounter = 2

function toggleChat() {
  isOpen.value = !isOpen.value
}

function scrollToBottom() {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })
watch(isOpen, (open) => {
  if (open) scrollToBottom()
})

async function sendMessage() {
  const text = inputMessage.value.trim()
  if (!text || loading.value || !authStore.accessToken) return

  messages.value.push({
    id: messageIdCounter++,
    role: 'user',
    content: text,
  })
  inputMessage.value = ''
  loading.value = true

  try {
    const { data } = await kanbanApi.chatWithAi(authStore.accessToken, text)

    messages.value.push({
      id: messageIdCounter++,
      role: 'assistant',
      content: data.message,
    })

    if (data.action === 'CREATE_TASK' && data.task) {
      emit('task-created', data.task)
    }
  } catch (error) {
    messages.value.push({
      id: messageIdCounter++,
      role: 'assistant',
      content: extractApiErrorMessage(error, 'Não foi possível processar sua mensagem.'),
    })
  } finally {
    loading.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendMessage()
  }
}
</script>

<template>
  <div class="ai-chatbox-root">
    <Transition name="ai-chatbox-panel">
      <div v-if="isOpen" class="ai-chatbox-panel">
        <header class="ai-chatbox-header">
          <div class="ai-chatbox-header-info">
            <span class="ai-chatbox-header-icon">
              <i class="pi pi-sparkles" />
            </span>
            <div>
              <h3 class="ai-chatbox-title">Assistente IA</h3>
              <p class="ai-chatbox-subtitle">
                {{ columns.length }} colunas disponíveis
              </p>
            </div>
          </div>
          <Button
            icon="pi pi-times"
            text
            rounded
            severity="secondary"
            aria-label="Fechar chat"
            @click="toggleChat"
          />
        </header>

        <div ref="messagesContainer" class="ai-chatbox-messages">
          <div
            v-for="message in messages"
            :key="message.id"
            class="ai-chatbox-message"
            :class="`ai-chatbox-message--${message.role}`"
          >
            <div class="ai-chatbox-bubble">
              {{ message.content }}
            </div>
          </div>

          <div v-if="loading" class="ai-chatbox-message ai-chatbox-message--assistant">
            <div class="ai-chatbox-bubble ai-chatbox-bubble--loading">
              <span class="ai-chatbox-dot" />
              <span class="ai-chatbox-dot" />
              <span class="ai-chatbox-dot" />
              <span class="ai-chatbox-loading-text">IA pensando...</span>
            </div>
          </div>
        </div>

        <footer class="ai-chatbox-footer">
          <Textarea
            v-model="inputMessage"
            placeholder="Descreva a tarefa que deseja criar..."
            class="ai-chatbox-input"
            rows="2"
            :autoResize="true"
            :disabled="loading"
            @keydown="handleKeydown"
          />
          <Button
            icon="pi pi-send"
            rounded
            :loading="loading"
            :disabled="!inputMessage.trim() || loading"
            aria-label="Enviar mensagem"
            @click="sendMessage"
          />
        </footer>
      </div>
    </Transition>

    <button
      type="button"
      class="ai-chatbox-fab"
      :class="{ 'ai-chatbox-fab--open': isOpen }"
      aria-label="Abrir assistente de IA"
      @click="toggleChat"
    >
      <i :class="isOpen ? 'pi pi-times' : 'pi pi-sparkles'" />
    </button>
  </div>
</template>

<style scoped>
.ai-chatbox-root {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.ai-chatbox-fab {
  width: 3.5rem;
  height: 3.5rem;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  color: #ffffff;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.ai-chatbox-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.55);
}

.ai-chatbox-fab--open {
  background: #475569;
  box-shadow: 0 8px 20px rgba(71, 85, 105, 0.35);
}

.ai-chatbox-panel {
  width: min(92vw, 380px);
  height: min(70vh, 520px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.ai-chatbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-bottom: 1px solid #c7d2fe;
}

.ai-chatbox-header-info {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ai-chatbox-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.6rem;
  background: #6366f1;
  color: #ffffff;
}

.ai-chatbox-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #312e81;
}

.ai-chatbox-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: #6366f1;
}

.ai-chatbox-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f8fafc;
}

.ai-chatbox-message {
  display: flex;
}

.ai-chatbox-message--user {
  justify-content: flex-end;
}

.ai-chatbox-message--assistant {
  justify-content: flex-start;
}

.ai-chatbox-bubble {
  max-width: 85%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  font-size: 0.84rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-chatbox-message--user .ai-chatbox-bubble {
  background: #6366f1;
  color: #ffffff;
  border-bottom-right-radius: 0.25rem;
}

.ai-chatbox-message--assistant .ai-chatbox-bubble {
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 0.25rem;
}

.ai-chatbox-bubble--loading {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.ai-chatbox-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: #6366f1;
  animation: ai-chatbox-pulse 1.2s infinite ease-in-out;
}

.ai-chatbox-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.ai-chatbox-dot:nth-child(3) {
  animation-delay: 0.3s;
}

.ai-chatbox-loading-text {
  margin-left: 0.35rem;
  font-size: 0.78rem;
  color: #64748b;
}

.ai-chatbox-footer {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.ai-chatbox-input {
  flex: 1;
  font-size: 0.84rem;
}

.ai-chatbox-panel-enter-active,
.ai-chatbox-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.ai-chatbox-panel-enter-from,
.ai-chatbox-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@keyframes ai-chatbox-pulse {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: scale(0.85);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .ai-chatbox-root {
    right: 0.75rem;
    bottom: 0.75rem;
  }

  .ai-chatbox-panel {
    width: calc(100vw - 1.5rem);
    height: min(72vh, 480px);
  }
}
</style>
