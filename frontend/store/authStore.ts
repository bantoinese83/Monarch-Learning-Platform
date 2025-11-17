import { create } from 'zustand'

interface User {
  id: number
  username: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: User, access: string, refresh: string) => void
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user, access, refresh) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({
      user,
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true,
      isInitialized: true,
    })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },
  init: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (userStr && accessToken) {
        try {
          const user = JSON.parse(userStr)
          set({
            user,
            accessToken,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isInitialized: true,
          })
        } catch (error) {
          // Invalid user data, clear it
          localStorage.removeItem('user')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isInitialized: true,
          })
        }
      } else {
        // No stored auth data
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
        })
      }
    } else {
      // Server-side rendering
      set({
        isInitialized: true,
      })
    }
  },
}))
