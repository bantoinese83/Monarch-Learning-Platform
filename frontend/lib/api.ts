import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Add token to requests
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Don't override Content-Type for file uploads (multipart/form-data)
    // Axios will automatically set it when FormData is detected
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'] // Let axios set it automatically
    }
  }
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors with token refresh
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          })
          const { access } = response.data
          localStorage.setItem('access_token', access)
          // Update auth store with new token
          if (typeof window !== 'undefined') {
            const { useAuthStore } = await import('@/store/authStore')
            const store = useAuthStore.getState()
            if (store.accessToken) {
              useAuthStore.setState({ accessToken: access })
            }
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`
            return api.request(originalRequest)
          }
        } catch {
          // Refresh failed - logout user
          if (typeof window !== 'undefined') {
            const { useAuthStore } = await import('@/store/authStore')
            useAuthStore.getState().logout()
          }
          window.location.href = '/login'
        }
      } else {
        // No refresh token - logout user
        if (typeof window !== 'undefined') {
          const { useAuthStore } = await import('@/store/authStore')
          useAuthStore.getState().logout()
        }
        window.location.href = '/login'
      }
    }

    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data as any

      // Format error message
      let message = 'An error occurred'
      if (data?.detail) {
        message = data.detail
      } else if (data?.error) {
        message = data.error
      } else if (data?.message) {
        message = data.message
      } else if (typeof data === 'string') {
        message = data
      }

      // Create enhanced error
      const enhancedError = new Error(message)
      ;(enhancedError as any).status = status
      ;(enhancedError as any).data = data
      return Promise.reject(enhancedError)
    } else if (error.request) {
      // Request made but no response received
      const networkError = new Error('Network error. Please check your connection.')
      ;(networkError as any).isNetworkError = true
      return Promise.reject(networkError)
    } else {
      // Something else happened
      return Promise.reject(error)
    }
  }
)

export default api
