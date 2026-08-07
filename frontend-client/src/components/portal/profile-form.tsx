'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import { profileSchema, type ProfileInput } from '@/lib/validation/forms'

export function ProfileForm({
  defaultValues,
  canUpdate = true,
}: {
  defaultValues: ProfileInput
  canUpdate?: boolean
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })
  async function submit(values: ProfileInput) {
    if (!canUpdate) return
    const result = await apiMutation('/api/portal/profile', 'PATCH', values)
    if (!result.ok)
      for (const [field, messages] of Object.entries(result.errors ?? {}))
        if (messages?.[0])
          setError(field as keyof ProfileInput, { message: messages[0] })
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) router.refresh()
  }
  return (
    <form
      className="portal-form form-grid"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <fieldset className="profile-form__fieldset" disabled={!canUpdate}>
        <div className="field">
          <label htmlFor="profile-name">Họ và tên</label>
          <input
            id="profile-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name && <p className="field__error">{errors.name.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="profile-title">Chức vụ</label>
          <input
            id="profile-title"
            autoComplete="organization-title"
            {...register('title')}
          />
        </div>
        <div className="field">
          <label htmlFor="profile-phone">Số điện thoại</label>
          <input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="field__error">{errors.phone.message}</p>
          )}
        </div>
        <FormFeedback value={feedback} className="form-grid__full" />
        <div className="form-grid__full">
          <Button type="submit" disabled={!canUpdate || isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="is-spinning" size={17} />
            ) : (
              <Save size={17} />
            )}
            {isSubmitting ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </Button>
        </div>
      </fieldset>
      {!canUpdate && (
        <p className="field__help">
          Bạn chỉ có quyền xem hồ sơ. Liên hệ quản trị viên để cập nhật.
        </p>
      )}
    </form>
  )
}
