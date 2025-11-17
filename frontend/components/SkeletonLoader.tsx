'use client'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  variant?: 'text' | 'card' | 'circle' | 'rect'
}

export default function SkeletonLoader({
  className = '',
  lines = 1,
  variant = 'text',
}: SkeletonLoaderProps) {
  const baseClasses = 'skeleton rounded'

  const variantClasses = {
    text: 'h-4',
    card: 'h-32',
    circle: 'h-12 w-12 rounded-full',
    rect: 'h-24 w-full',
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses.text} ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    )
  }

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
}
