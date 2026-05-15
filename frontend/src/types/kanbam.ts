export interface CreateTaskPayload {
  title: string
  description?: string
  columnId: number
}

export interface UpdateTaskPayload {
  title?: string
  description?: string | null
  columnId?: number
}

export interface Task {
  id: number
  title: string
  description: string | null
  order: number
  columnId: number
  createdAt: string
  updatedAt: string
}

export interface Column {
  id: number
  title: string
  order: number
}
