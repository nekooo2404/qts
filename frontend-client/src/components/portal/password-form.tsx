'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  passwordChangeSchema,
  type PasswordChangeInput,
} from '@/lib/validation/forms'

export function PasswordForm({ canUpdate = true }: { canUpdate?: boolean }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  async function submit(values: PasswordChangeInput) {
    if (!canUpdate) return
    const result = await apiMutation<{ signedOut?: boolean }>(
      '/api/portal/profile/password',
      'PATCH',
      values,
    )
    if (!result.ok)
      for (const [field, messages] of Object.entries(result.errors ?? {}))
        if (messages?.[0])
          setError(field as keyof PasswordChangeInput, { message: messages[0] })
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok && result.data?.signedOut) {
      router.replace('/portal/login')
      router.refresh()
    }
  }
  return (
    <form className="portal-form" onSubmit={handleSubmit(submit)} noValidate>
      <fieldset className="portal-form__fieldset" disabled={!canUpdate}>
        <div className="field">
          <label htmlFor="current-password">Mật khẩu hiện tại</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="field__error">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="field">
          <label htmlFor="new-password">Mật khẩu mới</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="field__error">{errors.newPassword.message}</p>
          )}
          <p className="field__help">
            Tối thiểu 12 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
          </p>
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="field__error">{errors.confirmPassword.message}</p>
          )}
        </div>
        <FormFeedback value={feedback} />
        <Button type="submit" disabled={!canUpdate || isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="is-spinning" size={17} />
          ) : (
            <KeyRound size={17} />
          )}
          {isSubmitting ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </Button>
      </fieldset>
      {!canUpdate && (
        <p className="field__help">
          Bạn chỉ có quyền xem phần bảo mật. Liên hệ quản trị viên để đổi mật
          khẩu.
        </p>
      )}
    </form>
  )
}
