'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CircleAlert,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
} from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { loginSchema, type LoginInput } from '@/lib/validation/forms'

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const rootError = errors.root?.message

  async function onSubmit(values: LoginInput) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, next: nextPath }),
      })
      const payload = (await response.json()) as {
        message?: string
        redirectTo?: string
        errors?: Record<string, string[] | undefined>
      }

      if (!response.ok) {
        if (payload.errors?.email?.[0])
          setError('email', { message: payload.errors.email[0] })
        if (payload.errors?.password?.[0])
          setError('password', { message: payload.errors.password[0] })
        setError('root', { message: payload.message ?? 'Không thể đăng nhập.' })
        return
      }

      router.replace(payload.redirectTo ?? '/portal/dashboard')
      router.refresh()
    } catch {
      setError('root', {
        message: 'Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.',
      })
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <div className="auth-input">
          <Mail size={18} aria-hidden="true" />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </div>
        {errors.email && <p className="field__error">{errors.email.message}</p>}
      </div>
      <div className="field">
        <div className="auth-form__label-row">
          <label htmlFor="login-password">Mật khẩu</label>
          <Link href="/portal/forgot-password">Quên mật khẩu?</Link>
        </div>
        <div className="auth-input">
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p className="field__error">{errors.password.message}</p>
        )}
      </div>
      {rootError && (
        <p className="form-message form-message--error" role="alert">
          <CircleAlert size={18} aria-hidden="true" /> {rootError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle className="is-spinning" size={18} aria-hidden="true" />
        ) : (
          <LogIn size={18} aria-hidden="true" />
        )}
        {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập QTS Portal'}
      </Button>
    </form>
  )
}
