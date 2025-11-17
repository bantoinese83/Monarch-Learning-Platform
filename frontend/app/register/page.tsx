'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import FormField from '@/components/FormField'
import Button from '@/components/Button'

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password2: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    role: z.enum(['student', 'tutor', 'admin']).default('student'),
  })
  .refine(data => data.password === data.password2, {
    message: "Passwords don't match",
    path: ['password2'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError('')
    try {
      // Remove empty optional fields and password2 before sending
      const payload: Record<string, string> = {
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.password2,
        role: data.role || 'student',
      }

      // Only include non-empty optional fields
      if (data.first_name && data.first_name.trim()) {
        payload.first_name = data.first_name.trim()
      }
      if (data.last_name && data.last_name.trim()) {
        payload.last_name = data.last_name.trim()
      }

      const response = await api.post('/auth/register/', payload)
      const { user, access, refresh } = response.data
      setAuth(user, access, refresh)
      router.push('/dashboard')
    } catch (err: any) {
      // Show detailed validation errors
      const errorData = err.response?.data
      if (errorData) {
        if (typeof errorData === 'string') {
          setError(errorData)
        } else if (errorData.error) {
          setError(errorData.error)
        } else if (errorData.password) {
          setError(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password)
        } else if (errorData.non_field_errors) {
          setError(
            Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors[0]
              : errorData.non_field_errors
          )
        } else {
          // Show first validation error found
          const firstError = Object.values(errorData)[0]
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
        }
      } else {
        setError('Registration failed. Please check your input and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Create Account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>}
          <div className="space-y-4">
            <FormField
              label="Username"
              name="username"
              error={errors.username?.message}
              required
              hint="At least 3 characters"
            >
              <input
                {...register('username')}
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                className="input-enhanced disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Choose a username"
              />
            </FormField>
            <FormField label="Email" name="email" error={errors.email?.message} required>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="input-enhanced disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="your.email@example.com"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First Name"
                name="first_name"
                error={errors.first_name?.message}
                hint="Optional"
              >
                <input
                  {...register('first_name')}
                  id="first_name"
                  type="text"
                  autoComplete="given-name"
                  className="input-enhanced disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="First name"
                />
              </FormField>
              <FormField
                label="Last Name"
                name="last_name"
                error={errors.last_name?.message}
                hint="Optional"
              >
                <input
                  {...register('last_name')}
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  className="input-enhanced disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Last name"
                />
              </FormField>
            </div>
            <FormField
              label="Password"
              name="password"
              error={errors.password?.message}
              required
              hint="At least 8 characters"
            >
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="input-enhanced disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Create a password"
              />
            </FormField>
            <FormField
              label="Confirm Password"
              name="password2"
              error={errors.password2?.message}
              required
            >
              <input
                {...register('password2')}
                id="password2"
                type="password"
                autoComplete="new-password"
                className="input-enhanced disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Confirm your password"
              />
            </FormField>
          </div>
          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            Create Account
          </Button>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
