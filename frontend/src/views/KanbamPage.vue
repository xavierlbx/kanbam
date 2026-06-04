<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { kanbamApi } from '@/modules/kanbam/service/kanbamApi'
import type {
  Column,
  CreateTaskPayload,
  ReorderTasksPayload,
  Task,
  UpdateTaskPayload,
} from '@/types/kanbam'
import draggable from 'vuedraggable'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
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

const showTaskDialog = ref(false)
const taskDialogMode = ref<'create' | 'edit'>('create')
const editingTaskId = ref<number | null>(null)
const selectedColumnId = ref<number | null>(null)
const taskTitle = ref('')
const taskDescription = ref('')
const submittingTask = ref(false)
let dragSnapshot: Record<number, Task[]> | null = null

const isEditingTask = computed(() => taskDialogMode.value === 'edit')

const hasTasks = computed(() =>
  columns.value.some((column) => (tasksByColumn.value[column.id]?.length ?? 0) > 0),
)

const selectedColumnTitle = computed(() => {
  if (selectedColumnId.value === null) return ''
  return columns.value.find((column) => column.id === selectedColumnId.value)?.title ?? ''
})

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
    await kanbamApi.reorderTasks(authStore.accessToken, buildReorderPayload())
  } catch {
    tasksByColumn.value = snapshot
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao reordenar as tarefas.', life: 3000 })
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
      kanbamApi.findAllColumns(authStore.accessToken),
      kanbamApi.findAllTasks(authStore.accessToken),
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
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar o quadro.', life: 3000 })
  } finally {
    loading.value = false
  }
}

function openAddTask(columnId: number) {
  taskDialogMode.value = 'create'
  editingTaskId.value = null
  selectedColumnId.value = columnId
  taskTitle.value = ''
  taskDescription.value = ''
  showTaskDialog.value = true
}

function openEditTask(task: Task) {
  taskDialogMode.value = 'edit'
  editingTaskId.value = task.id
  selectedColumnId.value = task.columnId
  taskTitle.value = task.title
  taskDescription.value = task.description ?? ''
  showTaskDialog.value = true
}

function closeTaskDialog() {
  showTaskDialog.value = false
  taskDialogMode.value = 'create'
  editingTaskId.value = null
  selectedColumnId.value = null
  taskTitle.value = ''
  taskDescription.value = ''
}

function replaceTaskInBoard(updatedTask: Task) {
  for (const column of columns.value) {
    const list = getColumnTasks(column.id)
    const index = list.findIndex((task) => task.id === updatedTask.id)
    if (index !== -1) {
      list.splice(index, 1)
      break
    }
  }

  const targetList = getColumnTasks(updatedTask.columnId)
  targetList.push(updatedTask)
  targetList.sort((a, b) => a.order - b.order)
  normalizeLocalTaskOrder()
}

async function handleSubmitTask() {
  if (isEditingTask.value) {
    await handleEditTask()
    return
  }

  await handleAddTask()
}

async function handleAddTask() {
  if (!authStore.accessToken || selectedColumnId.value === null || !taskTitle.value.trim()) return
  submittingTask.value = true
  try {
    const payload: CreateTaskPayload = {
      title: taskTitle.value.trim(),
      description: taskDescription.value.trim() || undefined,
      columnId: selectedColumnId.value,
    }
    const { data } = await kanbamApi.createTask(authStore.accessToken, payload)
    getColumnTasks(data.columnId).push(data)
    normalizeLocalTaskOrder()
    showTaskDialog.value = false
    toast.add({ severity: 'success', summary: 'Criado', detail: 'Tarefa criada com sucesso!', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar a tarefa.', life: 3000 })
  } finally {
    submittingTask.value = false
  }
}

async function handleEditTask() {
  if (!authStore.accessToken || editingTaskId.value === null || !taskTitle.value.trim()) return

  submittingTask.value = true
  try {
    const trimmedDescription = taskDescription.value.trim()
    const payload: UpdateTaskPayload = {
      title: taskTitle.value.trim(),
      description: trimmedDescription ? trimmedDescription : null,
    }

    const { data } = await kanbamApi.updateTask(authStore.accessToken, editingTaskId.value, payload)
    replaceTaskInBoard(data)
    showTaskDialog.value = false
    toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Tarefa atualizada com sucesso!', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar a tarefa.', life: 3000 })
  } finally {
    submittingTask.value = false
  }
}

async function handleDeleteTask(taskId: number) {
  if (!authStore.accessToken) return
  try {
    await kanbamApi.removeTask(authStore.accessToken, taskId)
    columns.value.forEach((column) => {
      const list = getColumnTasks(column.id)
      tasksByColumn.value[column.id] = list.filter((task) => task.id !== taskId)
    })
    normalizeLocalTaskOrder()
    toast.add({ severity: 'success', summary: 'Removido', detail: 'Tarefa removida.', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao remover a tarefa.', life: 3000 })
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/')
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
        <h1 class="kanban-header-title">Kanbam</h1>
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
            <Button
              icon="pi pi-plus"
              text
              rounded
              size="small"
              class="kanban-column-add-btn"
              v-tooltip.top="'Adicionar tarefa'"
              @click="openAddTask(col.id)"
            />
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
            >
              <template #item="{ element: task }">
                <div class="kanban-task">
                  <div class="kanban-task-body">
                    <p class="kanban-task-title">{{ task.title }}</p>
                    <p v-if="task.description" class="kanban-task-description">{{ task.description }}</p>
                  </div>
                  <div class="kanban-task-footer">
                    <span class="kanban-task-id">#{{ task.id }}</span>
                    <div class="kanban-task-actions">
                      <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        size="small"
                        severity="secondary"
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
    v-model:visible="showTaskDialog"
    modal
    class="task-dialog"
    :style="{ width: '90vw', maxWidth: '480px' }"
    :draggable="false"
    :dismissableMask="!submittingTask"
    :closable="!submittingTask"
    @hide="closeTaskDialog"
  >
    <template #header>
      <div class="task-dialog-header">
        <span class="task-dialog-header-icon">
          <i :class="isEditingTask ? 'pi pi-pencil' : 'pi pi-plus-circle'" />
        </span>
        <div class="task-dialog-header-copy">
          <h3>{{ isEditingTask ? 'Editar tarefa' : 'Nova tarefa' }}</h3>
          <p>
            {{
              isEditingTask
                ? `Atualizar em ${selectedColumnTitle || 'quadro'}`
                : selectedColumnTitle
                  ? `Adicionar em ${selectedColumnTitle}`
                  : 'Adicionar ao quadro'
            }}
          </p>
        </div>
      </div>
    </template>

    <form class="task-form" @submit.prevent="handleSubmitTask">
      <div class="task-form-field">
        <label class="task-form-label" for="task-title">Título *</label>
        <InputText
          id="task-title"
          v-model="taskTitle"
          placeholder="Nome da tarefa"
          class="w-full"
          autofocus
        />
        <small class="task-form-help">Use um nome curto e objetivo para a tarefa.</small>
      </div>

      <div class="task-form-field">
        <label class="task-form-label" for="task-desc">Descrição</label>
        <Textarea
          id="task-desc"
          v-model="taskDescription"
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
          :disabled="submittingTask"
          @click="showTaskDialog = false"
        />
        <Button
          :label="isEditingTask ? 'Salvar alterações' : 'Criar tarefa'"
          :icon="isEditingTask ? 'pi pi-save' : 'pi pi-check'"
          type="submit"
          :loading="submittingTask"
          :disabled="!taskTitle.trim()"
        />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
/* ── App shell ──────────────────────────────────────────────── */
.kanban-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f9;
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 4px solid transparent;
}

.kanban-column--backlog { border-top-color: #94a3b8; }
.kanban-column--todo    { border-top-color: #6366f1; }
.kanban-column--doing   { border-top-color: #f59e0b; }
.kanban-column--done    { border-top-color: #22c55e; }

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

.kanban-column--backlog .kanban-column-dot { background: #94a3b8; }
.kanban-column--todo    .kanban-column-dot { background: #6366f1; }
.kanban-column--doing   .kanban-column-dot { background: #f59e0b; }
.kanban-column--done    .kanban-column-dot { background: #22c55e; }

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
  transition: color 0.15s, background 0.15s;
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

/* ── Task card ──────────────────────────────────────────────── */
.kanban-task {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.65rem;
  padding: 0.75rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  cursor: grab;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.kanban-task:active {
  cursor: grabbing;
}

.kanban-column--backlog .kanban-task { background: #faf9f9; }
.kanban-column--todo    .kanban-task { background: #eff0ff; }
.kanban-column--doing   .kanban-task { background: #fef3e0; }
.kanban-column--done    .kanban-task { background: #dcfce7; }

.kanban-task:hover {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
  border-color: #c7d2fe;
}

.kanban-task-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.kanban-task-description {
  margin: 0;
  font-size: 0.775rem;
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
  gap: 0.15rem;
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
  border: 1.5px dashed #e2e8f0;
  border-radius: 0.5rem;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
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
  gap: 1.15rem;
  padding-top: 0.15rem;
}

.task-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.task-form-help {
  margin-top: -0.15rem;
  color: #64748b;
  font-size: 0.74rem;
}

.task-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.4rem;
  border-top: 1px solid #e2e8f0;
}

.task-dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.task-dialog-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
  flex-shrink: 0;
}

.task-dialog-header-copy {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.task-dialog-header-copy h3 {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
  color: #0f172a;
}

.task-dialog-header-copy p {
  margin: 0;
  font-size: 0.78rem;
  color: #64748b;
}

.task-dialog :deep(.p-dialog) {
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
}

.task-dialog :deep(.p-dialog-header) {
  padding: 0.95rem 1.1rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  background:
    radial-gradient(circle at 100% 0, rgba(99, 102, 241, 0.08), transparent 46%),
    radial-gradient(circle at 0 100%, rgba(139, 92, 246, 0.09), transparent 42%),
    #f8fafc;
}

.task-dialog :deep(.p-dialog-content) {
  padding: 1rem 1.1rem 1.1rem;
  background: #ffffff;
}

.task-dialog :deep(.p-dialog-header-icon) {
  width: 2rem;
  height: 2rem;
  border-radius: 0.6rem;
  color: #475569;
}

.task-dialog :deep(.p-dialog-header-icon:hover) {
  background: #eef2ff;
  color: #4f46e5;
}

.task-dialog :deep(.p-inputtext),
.task-dialog :deep(.p-textarea) {
  border-radius: 0.65rem;
  border-width: 1.5px;
  border-color: #cbd5e1;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.task-dialog :deep(.p-inputtext:enabled:hover),
.task-dialog :deep(.p-textarea:enabled:hover) {
  border-color: #a5b4fc;
}

.task-dialog :deep(.p-inputtext:enabled:focus),
.task-dialog :deep(.p-textarea:enabled:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
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

