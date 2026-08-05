'use client'

import { useState } from 'react'
import { LoaderCircle, Megaphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/portal/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import { announcementSchema } from '@/lib/validation/forms'

export function AnnouncementForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState('ALL')
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function publish() {
    const parsed = announcementSchema.safeParse({ title, content, audience })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Nội dung chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    const result = await apiMutation(
      '/api/portal/announcements',
      'POST',
      parsed.data,
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) {
      setTitle('')
      setContent('')
      router.refresh()
    }
    setPending(false)
  }
  return (
    <div className="portal-form form-grid">
      <div className="field form-grid__full">
        <label htmlFor="announcement-title">Tiêu đề</label>
        <input
          id="announcement-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="field form-grid__full">
        <label htmlFor="announcement-content">Nội dung</label>
        <textarea
          id="announcement-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="announcement-audience">Đối tượng</label>
        <select
          id="announcement-audience"
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
        >
          <option value="ALL">Tất cả</option>
          <option value="STAFF">Nhân sự QTS</option>
          <option value="CUSTOMER">Khách hàng</option>
        </select>
      </div>
      <FormFeedback value={feedback} className="form-grid__full" />
      <div className="form-grid__full">
        <Button onClick={publish} disabled={pending}>
          {pending ? (
            <LoaderCircle className="is-spinning" size={17} />
          ) : (
            <Megaphone size={17} />
          )}
          {pending ? 'Đang đăng...' : 'Đăng bảng tin'}
        </Button>
      </div>
    </div>
  )
}
