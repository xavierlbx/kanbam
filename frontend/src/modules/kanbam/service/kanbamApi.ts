import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

import type { Column, CreateTaskPayload, Task, UpdateTaskPayload } from '@/types/kanbam'

function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export const kanbamApi = {
  findAllTasks(token: string) {
    return axios.get<Task[]>(`${BASE_URL}/api/kanbam/tasks`, authHeaders(token))
  },

  findAllColumns(token: string) {
    return axios.get<Column[]>(`${BASE_URL}/api/kanbam/columns`, authHeaders(token))
  },

  findTaskById(token: string, id: number) {
    return axios.get<Task>(`${BASE_URL}/api/kanbam/tasks/${id}`, authHeaders(token))
  },

  findTasksByColumn(token: string, columnId: number) {
    return axios.get<Task[]>(`${BASE_URL}/api/kanbam/columns/${columnId}/tasks`, authHeaders(token))
  },

  createTask(token: string, payload: CreateTaskPayload) {
    return axios.post<Task>(`${BASE_URL}/api/kanbam/tasks`, payload, authHeaders(token))
  },

  updateTask(token: string, id: number, payload: UpdateTaskPayload) {
    return axios.patch<Task>(`${BASE_URL}/api/kanbam/tasks/${id}`, payload, authHeaders(token))
  },

  removeTask(token: string, id: number) {
    return axios.delete<void>(`${BASE_URL}/api/kanbam/tasks/${id}`, authHeaders(token))
  },
}
