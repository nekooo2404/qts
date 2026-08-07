'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Mail,
  Send,
} from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validation/forms'

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordInput) {
    setMessage(null)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const payload = (await response.json()) as { message?: string }
      setMessage({
        type: response.ok ? 'success' : 'error',
        text: payload.message ?? 'Không thể xử lý yêu cầu.',
      })
    } catch {
      setMessage({
        type: 'error',
        text: 'Không thể kết nối. Vui lòng thử lại.',
      })
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="field">
        <label htmlFor="forgot-email">Email tài khoản</label>
        <div className="auth-input">
          <Mail size={18} aria-hidden="true" />
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </div>
        {errors.email && <p className="field__error">{errors.email.message}</p>}
      </div>
      {message && (
        <p
          className={`form-message form-message--${message.type}`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.type === 'success' ? (
            <CircleCheck size={18} />
          ) : (
            <CircleAlert size={18} />
          )}
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle className="is-spinning" size={18} />
        ) : (
          <Send size={18} />
        )}
        {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu khôi phục'}
      </Button>
    </form>
  )
}
