'use client'

import { useState } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import { notificationComposeSchema } from '@/lib/validation/forms'

export function NotificationComposer({
  recipients,
}: {
  recipients: {
    id: string
    name: string
    email: string
    organization: { name: string } | null
  }[]
}) {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [href, setHref] = useState('')
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function send() {
    const parsed = notificationComposeSchema.safeParse({
      userId,
      title,
      message,
      href,
    })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Thông tin chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    const result = await apiMutation(
      '/api/portal/notifications',
      'POST',
      parsed.data,
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) {
      setTitle('')
      setMessage('')
      setHref('')
      router.refresh()
    }
    setPending(false)
  }
  return (
    <div className="portal-form form-grid">
      <div className="field form-grid__full">
        <label htmlFor="notify-recipient">Người nhận</label>
        <select
          id="notify-recipient"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        >
          <option value="">Chọn người nhận</option>
          {recipients.map((user) => (
            <option value={user.id} key={user.id}>
              {user.name} · {user.organization?.name ?? user.email}
            </option>
          ))}
        </select>
      </div>
      <div className="field form-grid__full">
        <label htmlFor="notify-title">Tiêu đề</label>
        <input
          id="notify-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="field form-grid__full">
        <label htmlFor="notify-message">Nội dung</label>
        <textarea
          id="notify-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
      <div className="field form-grid__full">
        <label htmlFor="notify-href">Liên kết portal (tùy chọn)</label>
        <input
          id="notify-href"
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="/portal/projects/..."
        />
      </div>
      <FormFeedback value={feedback} className="form-grid__full" />
      <div className="form-grid__full">
        <Button onClick={send} disabled={pending}>
          {pending ? (
            <LoaderCircle className="is-spinning" size={17} />
          ) : (
            <Send size={17} />
          )}
          {pending ? 'Đang gửi...' : 'Gửi thông báo'}
        </Button>
      </div>
    </div>
  )
}
