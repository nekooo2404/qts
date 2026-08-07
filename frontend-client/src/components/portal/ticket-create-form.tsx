'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LifeBuoy, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  ticketSchema,
  type TicketInput,
  type TicketOutput,
} from '@/lib/validation/forms'

export function TicketCreateForm({
  projects,
}: {
  projects: { id: string; name: string; code: string }[]
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TicketInput, unknown, TicketOutput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: 'TECHNICAL',
      priority: 'MEDIUM',
      description: '',
      projectId: '',
    },
  })

  async function submit(values: TicketOutput) {
    setFeedback(null)
    const result = await apiMutation<{ id: string }>(
      '/api/portal/tickets',
      'POST',
      values,
    )
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.errors ?? {}))
        if (messages?.[0])
          setError(field as keyof TicketInput, { message: messages[0] })
      setFeedback({ type: 'error', message: result.message })
      return
    }
    setFeedback({ type: 'success', message: result.message })
    reset()
    router.refresh()
    if (result.data?.id) router.push(`/portal/tickets/${result.data.id}`)
  }

  return (
    <form
      className="portal-form form-grid"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="field form-grid__full">
        <label htmlFor="ticket-subject">Tiêu đề</label>
        <input
          id="ticket-subject"
          aria-invalid={Boolean(errors.subject)}
          {...register('subject')}
        />
        {errors.subject && (
          <p className="field__error">{errors.subject.message}</p>
        )}
      </div>
      <div className="field">
        <label htmlFor="ticket-category">Loại yêu cầu</label>
        <select id="ticket-category" {...register('category')}>
          <option value="TECHNICAL">Kỹ thuật</option>
          <option value="ACCOUNT">Tài khoản</option>
          <option value="BILLING">Thanh toán</option>
          <option value="OTHER">Khác</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="ticket-priority">Mức ưu tiên</label>
        <select id="ticket-priority" {...register('priority')}>
          <option value="LOW">Thấp</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HIGH">Cao</option>
          <option value="URGENT">Khẩn cấp</option>
        </select>
      </div>
      <div className="field form-grid__full">
        <label htmlFor="ticket-project">Dự án liên quan</label>
        <select id="ticket-project" {...register('projectId')}>
          <option value="">Không gắn dự án</option>
          {projects.map((project) => (
            <option value={project.id} key={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field form-grid__full">
        <label htmlFor="ticket-description">Nội dung</label>
        <textarea
          id="ticket-description"
          aria-invalid={Boolean(errors.description)}
          placeholder="Mô tả hiện tượng, thời điểm và kết quả mong đợi."
          {...register('description')}
        />
        {errors.description && (
          <p className="field__error">{errors.description.message}</p>
        )}
      </div>
      <FormFeedback value={feedback} className="form-grid__full" />
      <div className="form-grid__full portal-form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="is-spinning" size={17} aria-hidden />
          ) : (
            <LifeBuoy size={17} aria-hidden />
          )}
          {isSubmitting ? 'Đang tạo...' : 'Tạo ticket'}
        </Button>
      </div>
    </form>
  )
}
