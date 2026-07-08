export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: 'user' | 'admin'
  emailVerified: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Session {
  id: string
  userAgent: string | null
  ipAddress: string | null
  location: string | null
  isCurrent: boolean
  lastUsedAt: string
  createdAt: string
  expiresAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface ApiError {
  status: string
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
