import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api, setAccessToken } from '@/lib/api-client'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ status: string; data: { user: User } }>('/users/me')
      setUser(res.data.user)
    } catch {
      setUser(null)
      setAccessToken(null)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      setAccessToken(token)
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      status: string
      data: { user: User; accessToken: string; mfaRequired?: boolean; userId?: string }
    }>('/auth/login', { email, password })

    if (res.data.mfaRequired) {
      throw { mfaRequired: true, userId: res.data.userId }
    }

    setAccessToken(res.data.accessToken)
    sessionStorage.setItem('accessToken', res.data.accessToken)
    setUser(res.data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await api.post<{
      status: string
      data: { user: User; accessToken: string }
    }>('/auth/register', { email, password, name })

    setAccessToken(res.data.accessToken)
    sessionStorage.setItem('accessToken', res.data.accessToken)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    setAccessToken(null)
    sessionStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
