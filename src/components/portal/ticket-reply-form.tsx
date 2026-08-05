'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/portal/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  ticketMessageSchema,
  type TicketMessageInput,
} from '@/lib/validation/forms'

export function TicketReplyForm({
  ticketId,
  canUseInternal,
}: {
  ticketId: string
  canUseInternal: boolean
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketMessageInput>({
    resolver: zodResolver(ticketMessageSchema),
    defaultValues: { content: '', internal: false },
  })

  async function submit(values: TicketMessageInput) {
    setFeedback(null)
    const result = await apiMutation(
      `/api/portal/tickets/${ticketId}/messages`,
      'POST',
      values,
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) {
      reset()
      router.refresh()
    }
  }

  return (
    <form
      className="ticket-reply portal-form"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="field">
        <label htmlFor="ticket-reply">Phản hồi</label>
        <textarea
          id="ticket-reply"
          aria-invalid={Boolean(errors.content)}
          placeholder="Nhập nội dung trao đổi..."
          {...register('content')}
        />
        {errors.content && (
          <p className="field__error">{errors.content.message}</p>
        )}
      </div>
      {canUseInternal && (
        <label className="checkbox-field">
          <input type="checkbox" {...register('internal')} />
          <span>Ghi chú nội bộ, khách hàng không nhìn thấy</span>
        </label>
      )}
      <FormFeedback value={feedback} />
      <div className="portal-form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="is-spinning" size={17} aria-hidden />
          ) : (
            <Send size={17} aria-hidden />
          )}
          {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
        </Button>
      </div>
    </form>
  )
}
