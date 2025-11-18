'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import CircleAnimation from '@/components/CircleAnimation'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isInitialized, init } = useAuthStore()

  useEffect(() => {
    // Initialize auth state
    if (!isInitialized) {
      init()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Only redirect after initialization is complete
    if (isInitialized) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitialized])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <CircleAnimation
        type="sonar-sweep"
        size="lg"
        text="Redirecting..."
        title="Initializing"
      />
    </div>
  )
}
