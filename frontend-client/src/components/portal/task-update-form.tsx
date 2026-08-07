'use client'

import { useState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'

export function TaskUpdateForm({
  id,
  status,
  progress,
}: {
  id: string
  status: string
  progress: number
}) {
  const router = useRouter()
  const [nextStatus, setNextStatus] = useState(status)
  const [nextProgress, setNextProgress] = useState(progress)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)

  async function save() {
    setPending(true)
    setFeedback(null)
    const result = await apiMutation(`/api/portal/tasks/${id}`, 'PATCH', {
      status: nextStatus,
      progress: nextProgress,
    })
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) router.refresh()
    setPending(false)
  }

  return (
    <div className="task-inline-form">
      <label>
        <span className="sr-only">Trạng thái công việc</span>
        <select
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value)}
        >
          <option value="TODO">Cần làm</option>
          <option value="IN_PROGRESS">Đang xử lý</option>
          <option value="REVIEW">Đang duyệt</option>
          <option value="BLOCKED">Đang vướng</option>
          <option value="DONE">Hoàn tất</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Tiến độ</span>
        <input
          type="number"
          min="0"
          max="100"
          value={nextProgress}
          onChange={(event) => setNextProgress(Number(event.target.value))}
        />
      </label>
      <Button
        size="icon"
        variant="ghost"
        onClick={save}
        disabled={pending}
        aria-label="Lưu trạng thái công việc"
      >
        {pending ? (
          <LoaderCircle className="is-spinning" size={16} />
        ) : (
          <Save size={16} />
        )}
      </Button>
      <FormFeedback value={feedback} />
    </div>
  )
}
