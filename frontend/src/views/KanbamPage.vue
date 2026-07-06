<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { kanbanApi } from '@/modules/kanbam/service/kanbamApi'
import type { Column, CreateTaskPayload, ReorderTasksPayload, Task } from '@/types/kanbam'
import { extractApiErrorMessage } from '@/utils/apiError'
import draggable from 'vuedraggable'
import AiChatbox from '@/components/AiChatbox.vue'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const columns = ref<Column[]>([])
const tasksByColumn = ref<Record<number, Task[]>>({})
const loading = ref(true)
const savingOrder = ref(false)

const showAddTaskDialog = ref(false)
const selectedColumnId = ref<number | null>(null)
const editingTaskId = ref<number | null>(null)
const newTaskTitle = ref('')
const newTaskDescription = ref('')
const formColumnId = ref<number | null>(null)
const addingTask = ref(false)
let dragSnapshot: Record<number, Task[]> | null = null

const isEditingTask = computed(() => editingTaskId.value !== null)
const taskDialogTitle = computed(() => (isEditingTask.value ? 'Editar Tarefa' : 'Nova Tarefa'))
const taskDialogActionLabel = computed(() =>
  isEditingTask.value ? 'Salvar alterações' : 'Criar tarefa',
)

const hasTasks = computed(() =>
  columns.value.some((column) => (tasksByColumn.value[column.id]?.length ?? 0) > 0),
)

const COLUMN_ACCENTS: Record<number, string> = {
  0: 'backlog',
  1: 'todo',
  2: 'doing',
  3: 'done',
}

function getColumnAccent(order: number) {
  return COLUMN_ACCENTS[order] ?? 'backlog'
}

function cloneTaskMap(source: Record<number, Task[]>): Record<number, Task[]> {
  const clone: Record<number, Task[]> = {}
  for (const [columnId, list] of Object.entries(source)) {
    clone[Number(columnId)] = list.map((task) => ({ ...task }))
  }
  return clone
}

function haveTaskPositionsChanged(
  previous: Record<number, Task[]>,
  current: Record<number, Task[]>,
): boolean {
  const columnIds = new Set([
    ...Object.keys(previous).map(Number),
    ...Object.keys(current).map(Number),
  ])

  for (const columnId of columnIds) {
    const previousList = previous[columnId] ?? []
    const currentList = current[columnId] ?? []

    if (previousList.length !== currentList.length) {
      return true
    }

    for (let index = 0; index < previousList.length; index += 1) {
      if (previousList[index]?.id !== currentList[index]?.id) {
        return true
      }
    }
  }

  return false
}

function getColumnTasks(columnId: number): Task[] {
  if (!tasksByColumn.value[columnId]) {
    tasksByColumn.value[columnId] = []
  }
  return tasksByColumn.value[columnId]
}

function normalizeLocalTaskOrder() {
  columns.value.forEach((column) => {
    const list = getColumnTasks(column.id)
    list.forEach((task, index) => {
      task.columnId = column.id
      task.order = index
    })
  })
}

function buildReorderPayload(): ReorderTasksPayload {
  const tasks = columns.value.flatMap((column) =>
    getColumnTasks(column.id).map((task, index) => ({
      id: task.id,
      columnId: column.id,
      order: index,
    })),
  )

  return { tasks }
}

async function persistTaskOrder(snapshot: Record<number, Task[]>) {
  if (!authStore.accessToken || !hasTasks.value) return

  savingOrder.value = true
  try {
    normalizeLocalTaskOrder()
    await kanbanApi.reorderTasks(authStore.accessToken, buildReorderPayload())
  } catch (error) {
    tasksByColumn.value = snapshot
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: extractApiErrorMessage(error, 'Falha ao reordenar as tarefas.'),
      life: 3500,
    })
    await fetchData()
  } finally {
    savingOrder.value = false
  }
}

function handleDragStart() {
  dragSnapshot = cloneTaskMap(tasksByColumn.value)
}

async function handleDragEnd() {
  if (!dragSnapshot) return
  const snapshot = dragSnapshot
  dragSnapshot = null

  if (!haveTaskPositionsChanged(snapshot, tasksByColumn.value)) {
    return
  }

  await persistTaskOrder(snapshot)
}

async function fetchData() {
  if (!authStore.accessToken) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const [colRes, taskRes] = await Promise.all([
      kanbanApi.findAllColumns(authStore.accessToken),
      kanbanApi.findAllTasks(authStore.accessToken),
    ])
    columns.value = colRes.data.sort((a, b) => a.order - b.order)

    const nextMap: Record<number, Task[]> = {}
    columns.value.forEach((column) => {
      nextMap[column.id] = []
    })

    taskRes.data
      .slice()
      .sort((a, b) => (a.columnId === b.columnId ? a.order - b.order : a.columnId - b.columnId))
      .forEach((task) => {
        if (!nextMap[task.columnId]) {
          nextMap[task.columnId] = []
        }
        const list = nextMap[task.columnId]
        if (list) {
          list.push(task)
        }
      })

    tasksByColumn.value = nextMap
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: extractApiErrorMessage(error, 'Falha ao carregar o quadro.'),
      life: 3500,
    })
  } finally {
    loading.value = false
  }
}

function openAddTask(columnId: number) {
  editingTaskId.value = null
  selectedColumnId.value = columnId
  formColumnId.value = columnId
  newTaskTitle.value = ''
  newTaskDescription.value = ''
  showAddTaskDialog.value = true
}

function openEditTask(task: Task) {
  editingTaskId.value = task.id
  selectedColumnId.value = task.columnId
  formColumnId.value = task.columnId
  newTaskTitle.value = task.title
  newTaskDescription.value = task.description ?? ''
  showAddTaskDialog.value = true
}

function closeTaskDialog() {
  showAddTaskDialog.value = false
  selectedColumnId.value = null
  editingTaskId.value = null
  formColumnId.value = null
  newTaskTitle.value = ''
  newTaskDescription.value = ''
}

async function handleSaveTask() {
  if (!authStore.accessToken || !newTaskTitle.value.trim() || formColumnId.value === null) return
  addingTask.value = true
  try {
    const title = newTaskTitle.value.trim()
    const description = newTaskDescription.value.trim()

    if (isEditingTask.value && editingTaskId.value !== null) {
      const payload = {
        title,
        description: description || null,
        columnId: formColumnId.value,
      }

      const { data } = await kanbanApi.updateTask(
        authStore.accessToken,
        editingTaskId.value,
        payload,
      )

      columns.value.forEach((column) => {
        const list = getColumnTasks(column.id)
        tasksByColumn.value[column.id] = list.filter((task) => task.id !== data.id)
      })

      getColumnTasks(data.columnId).push(data)
      normalizeLocalTaskOrder()
      closeTaskDialog()
      toast.add({
        severity: 'success',
        summary: 'Atualizado',
        detail: 'Tarefa atualizada com sucesso!',
        life: 2000,
      })
      return
    }

    const payload: CreateTaskPayload = {
      title,
      description: description || undefined,
      columnId: formColumnId.value,
    }

    const { data } = await kanbanApi.createTask(authStore.accessToken, payload)
    getColumnTasks(data.columnId).push(data)
    normalizeLocalTaskOrder()
    closeTaskDialog()
    toast.add({
      severity: 'success',
      summary: 'Criado',
      detail: 'Tarefa criada com sucesso!',
      life: 2000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: extractApiErrorMessage(
        error,
        isEditingTask.value ? 'Falha ao atualizar a tarefa.' : 'Falha ao criar a tarefa.',
      ),
      life: 3500,
    })
  } finally {
    addingTask.value = false
  }
}

async function handleDeleteTask(taskId: number) {
  if (!authStore.accessToken) return
  try {
    await kanbanApi.removeTask(authStore.accessToken, taskId)
    columns.value.forEach((column) => {
      const list = getColumnTasks(column.id)
      tasksByColumn.value[column.id] = list.filter((task) => task.id !== taskId)
    })
    normalizeLocalTaskOrder()
    toast.add({ severity: 'success', summary: 'Removido', detail: 'Tarefa removida.', life: 2000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: extractApiErrorMessage(error, 'Falha ao remover a tarefa.'),
      life: 3500,
    })
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}

function handleAiTaskCreated(task: Task) {
  getColumnTasks(task.columnId).push(task)
  normalizeLocalTaskOrder()
  toast.add({
    severity: 'success',
    summary: 'Tarefa criada pela IA',
    detail: `"${task.title}" adicionada ao quadro.`,
    life: 2500,
  })
}

onMounted(fetchData)
</script>

<template>
  <Toast />

  <div class="kanban-app">
    <!-- Header -->
    <header class="kanban-header">
      <div class="kanban-header-left">
        <span class="kanban-header-logo">
          <i class="pi pi-th-large" />
        </span>
        <h1 class="kanban-header-title">Kanban</h1>
      </div>
      <div class="kanban-header-right">
        <span v-if="authStore.user" class="kanban-header-user">
          <i class="pi pi-user" />
          {{ authStore.user.name }}
        </span>
        <Button
          label="Logout"
          icon="pi pi-sign-out"
          outlined
          size="small"
          severity="secondary"
          @click="handleLogout"
        />
      </div>
    </header>

    <!-- Board area -->
    <main class="kanban-board-wrapper">
      <!-- Loading state -->
      <div v-if="loading" class="kanban-loading">
        <ProgressSpinner strokeWidth="4" />
        <p>Carregando quadro...</p>
      </div>

      <!-- Board -->
      <div v-else class="kanban-board">
        <div
          v-for="col in columns"
          :key="col.id"
          class="kanban-column"
          :class="`kanban-column--${getColumnAccent(col.order)}`"
        >
          <!-- Column header -->
          <div class="kanban-column-header">
            <div class="kanban-column-header-left">
              <span class="kanban-column-dot" />
              <h2 class="kanban-column-title">{{ col.title }}</h2>
              <span class="kanban-column-count">
                {{ getColumnTasks(col.id).length }}
              </span>
            </div>
          </div>

          <!-- Tasks list -->
          <div class="kanban-column-tasks">
            <draggable
              :list="getColumnTasks(col.id)"
              item-key="id"
              group="kanban-tasks"
              :animation="180"
              :delay="140"
              :delay-on-touch-only="true"
              :fallback-tolerance="8"
              ghost-class="kanban-task-ghost"
              chosen-class="kanban-task-chosen"
              drag-class="kanban-task-drag"
              :disabled="savingOrder"
              @start="handleDragStart"
              @end="handleDragEnd"
              class="kanban-task-list"
            >
              <template #item="{ element: task }">
                <div class="kanban-task">
                  <div class="kanban-task-body">
                    <p class="kanban-task-title">{{ task.title }}</p>
                    <p v-if="task.description" class="kanban-task-description">
                      {{ task.description }}
                    </p>
                  </div>
                  <div class="kanban-task-footer">
                    <span class="kanban-task-id">#{{ task.id }}</span>
                    <div class="kanban-task-actions">
                      <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        size="small"
                        class="kanban-task-edit"
                        @click.stop="openEditTask(task)"
                      />
                      <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        size="small"
                        severity="danger"
                        class="kanban-task-delete"
                        @click.stop="handleDeleteTask(task.id)"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </draggable>

            <!-- Empty state -->
            <div v-if="!getColumnTasks(col.id).length" class="kanban-column-empty">
              <i class="pi pi-inbox" />
              <p>Sem tarefas</p>
            </div>

            <!-- Add task inline -->
            <button class="kanban-column-add-inline" type="button" @click="openAddTask(col.id)">
              <i class="pi pi-plus" />
              Adicionar tarefa
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Add Task Dialog -->
  <Dialog
    v-model:visible="showAddTaskDialog"
    modal
    :header="taskDialogTitle"
    :style="{ width: '90vw', maxWidth: '480px' }"
    :draggable="false"
    class="task-dialog"
    @hide="closeTaskDialog"
  >
    <form class="task-form" @submit.prevent="handleSaveTask">

      <div class="task-form-field">
        <label class="task-form-label" for="task-title">Título *</label>
        <InputText
          id="task-title"
          v-model="newTaskTitle"
          placeholder="Nome da tarefa"
          class="w-full"
          autofocus
        />
      </div>

      <div class="task-form-field">
        <label class="task-form-label" for="task-column">Coluna</label>
        <Select
          id="task-column"
          v-model="formColumnId"
          :options="columns"
          optionLabel="title"
          optionValue="id"
          placeholder="Selecione uma coluna"
          class="w-full"
        />
      </div>

      <div class="task-form-field">
        <label class="task-form-label" for="task-desc">Descrição</label>
        <Textarea
          id="task-desc"
          v-model="newTaskDescription"
          placeholder="Descreva a tarefa (opcional)"
          class="w-full"
          rows="3"
          :autoResize="true"
        />
      </div>

      <div class="task-form-actions">
        <Button
          label="Cancelar"
          outlined
          severity="secondary"
          type="button"
          @click="closeTaskDialog"
        />
        <Button
          :label="taskDialogActionLabel"
          icon="pi pi-check"
          type="submit"
          :loading="addingTask"
          :disabled="!newTaskTitle.trim() || formColumnId === null"
        />
      </div>
    </form>
  </Dialog>

  <AiChatbox v-if="!loading && columns.length" :columns="columns" @task-created="handleAiTaskCreated" />
</template>

<style scoped>
/* ── App shell ──────────────────────────────────────────────── */
.kanban-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #d6d6d6;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Header ─────────────────────────────────────────────────── */
.kanban-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.5rem;
  height: 60px;
  background: linear-gradient(135deg, #6164ff 0%, #4346ca 40%);
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.kanban-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.kanban-header-logo {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
}

.kanban-header-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
}

.kanban-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.kanban-header-user {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.9;
}

/* Override PrimeVue outlined button colours inside the header */
.kanban-header :deep(.p-button-outlined) {
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.55) !important;
}
.kanban-header :deep(.p-button-outlined:hover) {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: #ffffff !important;
}

/* ── Board wrapper ──────────────────────────────────────────── */
.kanban-board-wrapper {
  flex: 1;
  padding: 1.5rem;
  overflow-x: auto;
}

/* ── Loading ────────────────────────────────────────────────── */
.kanban-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 60vh;
  color: #6366f1;
  font-size: 0.9rem;
}

/* ── Board ──────────────────────────────────────────────────── */
.kanban-board {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  min-height: calc(100vh - 140px);
}

/* ── Column ─────────────────────────────────────────────────── */
.kanban-column {
  flex: 1;
  background: #fcfcfc;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 4px solid transparent;
}

.kanban-column--backlog {
  border-top-color: #94a3b8;
}
.kanban-column--todo {
  border-top-color: #6366f1;
}
.kanban-column--doing {
  border-top-color: #f59e0b;
}
.kanban-column--done {
  border-top-color: #22c55e;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem 0.7rem;
}

.kanban-column-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kanban-column-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.kanban-column--backlog .kanban-column-dot {
  background: #94a3b8;
}
.kanban-column--todo .kanban-column-dot {
  background: #6366f1;
}
.kanban-column--doing .kanban-column-dot {
  background: #f59e0b;
}
.kanban-column--done .kanban-column-dot {
  background: #22c55e;
}

.kanban-column-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  margin-bottom: 1px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kanban-column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.3rem;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
  margin-bottom: 1px;
}

.kanban-column-add-btn {
  color: #94a3b8 !important;
  transition:
    color 0.15s,
    background 0.15s;
}
.kanban-column-add-btn:hover {
  color: #6366f1 !important;
  background: #eef2ff !important;
}

/* ── Tasks list ─────────────────────────────────────────────── */
.kanban-column-tasks {
  flex: 1;
  padding: 0 0.9rem 0.75rem;
  padding-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  max-height: calc(100vh - 210px);
}

.kanban-column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 2rem 1rem;
  color: #cbd5e1;
  font-size: 0.78rem;
}

.kanban-column-empty .pi {
  font-size: 1.4rem;
}

.kanban-task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ── Task card ──────────────────────────────────────────────── */
.kanban-task {
  border: 1.5px solid #e2e8f0;
  background-color: #fff;
  border-radius: 0.65rem;
  padding: 0.75rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
  cursor: grab;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.kanban-task:active {
  cursor: grabbing;
}

.kanban-task:hover {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
  border-color: #c7d2fe;
}

.kanban-task-title {
  margin: 0;
  margin-bottom: 0.25rem;
  margin-left: 0.05rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.kanban-task-description {
  margin: 0;
  font-size: 0.65rem;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kanban-task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kanban-task-actions {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.kanban-task-ghost {
  opacity: 0.35;
}

.kanban-task-chosen {
  border-color: #a5b4fc;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.22);
}

.kanban-task-drag {
  transform: rotate(1deg);
}

.kanban-task-id {
  font-size: 0.7rem;
  color: #cbd5e1;
  font-weight: 500;
}

.kanban-task-delete {
  opacity: 0;
  transition: opacity 0.15s;
}

.kanban-task-edit {
  opacity: 0;
  color: #0ea5e9 !important;
  transition: opacity 0.15s;
}

.kanban-task:hover .kanban-task-delete,
.kanban-task:hover .kanban-task-edit {
  opacity: 1;
}

/* ── Add inline ─────────────────────────────────────────────── */
.kanban-column-add-inline {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  margin-top: 0.15rem;
  background: transparent;
  border: 1.5px dashed #d2d7dd;
  border-radius: 0.5rem;
  color: #7b8899;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
  font-family: inherit;
}

.kanban-column-add-inline:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #eef2ff;
}

/* ── Dialog form ────────────────────────────────────────────── */
.task-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.25rem;
}

.task-form-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  border-radius: 0.75rem;
  padding: 0.75rem 0.85rem;
}

.task-form-banner .pi {
  font-size: 1rem;
  margin-top: 0.1rem;
}

.task-form-banner-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
}

.task-form-banner-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: #475569;
}

.task-form-banner--create {
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  color: #4338ca;
}

.task-form-banner--edit {
  background: linear-gradient(135deg, #ecfeff, #cffafe);
  color: #0f766e;
}

.task-dialog :deep(.p-dialog-header) {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.85rem;
}

.task-dialog :deep(.p-dialog-content) {
  padding-top: 0.9rem;
}

.task-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.task-form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.task-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 640px) {
  .kanban-board-wrapper {
    padding: 1rem 0.75rem;
  }

  .kanban-board {
    flex-direction: column;
    align-items: stretch;
  }

  .kanban-column {
    flex: none;
    width: 100%;
  }

  .kanban-column-tasks {
    max-height: none;
  }

  .kanban-header-user {
    display: none;
  }

  .kanban-task-delete {
    opacity: 1;
  }

  .kanban-task-edit {
    opacity: 1;
  }
}
</style>
