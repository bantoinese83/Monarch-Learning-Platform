'use client'

import { useState, useEffect } from 'react'

type ConnectionStatus = 'online' | 'offline' | 'connecting'

interface ConnectionStatusProps {
  className?: string
}

export default function ConnectionStatus({ className = "" }: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to reach the backend health endpoint
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/api/health/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        // Health endpoint should return 200 if backend is healthy
        if (response.ok) {
          setStatus('online')
        } else {
          setStatus('offline')
        }
      } catch (error) {
        setStatus('offline')
      }
    }

    // Initial check
    checkConnection()

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus('connecting')
      checkConnection()
    }

    const handleOffline = () => setStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Connected',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      case 'offline':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Disconnected',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        }
      case 'connecting':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Connecting...',
          icon: (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`relative inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap z-50">
          {status === 'online' ? 'Connected to tutor service' :
           status === 'offline' ? 'Unable to connect to tutor service' :
           'Attempting to connect...'}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}
