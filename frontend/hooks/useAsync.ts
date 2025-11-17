import { useCallback, useEffect, useState } from 'react'

interface UseAsyncOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useAsync<T>(asyncFunction: () => Promise<T>, options: UseAsyncOptions = {}) {
  const { immediate = true, onSuccess, onError } = options
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [value, setValue] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setStatus('pending')
    setValue(null)
    setError(null)

    try {
      const response = await asyncFunction()
      setValue(response)
      setStatus('success')
      onSuccess?.(response)
      return response
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      setStatus('error')
      onError?.(error)
      throw error
    }
  }, [asyncFunction, onSuccess, onError])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return { execute, status, value, error, isLoading: status === 'pending' }
}
