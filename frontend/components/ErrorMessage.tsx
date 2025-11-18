'use client'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

export default function ErrorMessage({ message, onRetry, className = "" }: ErrorMessageProps) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-800 font-medium">Something went wrong</p>
        <p className="text-sm text-red-700 mt-1">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors duration-150"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
