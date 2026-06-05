export type AuthUser = {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type AuthResponse = {
  accessToken: string
  user: AuthUser
}
