'use client'

import Link from 'next/link'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href: string
    onClick?: () => void
  }
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
      <div className="mx-auto max-w-md animate-fade-in">
        <div className="mb-4 flex justify-center">{icon || defaultIcon}</div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {action && (
              action.href === '#' && action.onClick ? (
                <button
                  onClick={action.onClick}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-primary-700 hover:to-primary-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.98]"
                >
                  {action.label}
                  <svg
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ) : (
                <Link
                  href={action.href}
                  onClick={action.onClick}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-primary-700 hover:to-primary-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.98]"
                >
                  {action.label}
                  <svg
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )
            )}
            {secondaryAction && (
              secondaryAction.href === '#' && secondaryAction.onClick ? (
                <button
                  onClick={secondaryAction.onClick}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.98]"
                >
                  {secondaryAction.label}
                </button>
              ) : (
                <Link
                  href={secondaryAction.href}
                  onClick={secondaryAction.onClick}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.98]"
                >
                  {secondaryAction.label}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
