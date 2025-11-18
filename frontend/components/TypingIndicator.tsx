'use client'

import { useEffect, useState } from 'react'

interface TypingIndicatorProps {
  text?: string
  className?: string
}

export default function TypingIndicator({ text = "Thinking...", className = "" }: TypingIndicatorProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center">
        <div className="relative">
          <div className="h-2 w-2 animate-ping rounded-full bg-primary-400"></div>
          <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-primary-500"></div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">{text}</span>
        <span className="text-sm text-gray-600 font-mono w-4">{dots}</span>
      </div>
    </div>
  )
}
