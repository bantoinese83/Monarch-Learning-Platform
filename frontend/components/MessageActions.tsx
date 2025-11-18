'use client'

import { useState } from 'react'

interface MessageActionsProps {
  onCopy?: () => void
  onRegenerate?: () => void
  onDelete?: () => void
  isAssistant?: boolean
  className?: string
}

export default function MessageActions({
  onCopy,
  onRegenerate,
  onDelete,
  isAssistant = false,
  className = ''
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy?.()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}>
      {onCopy && (
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
          title="Copy message"
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}

      {isAssistant && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
          title="Regenerate response"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors duration-150"
          title="Delete message"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
