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
import { TaskStatusSelect } from '@client/components/portal/task-status-select'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE'
type TaskDraft = { status?: TaskStatus; progress?: number | '' }

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
  const [draft, setDraft] = useState<TaskDraft>({})
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const nextStatus = draft.status ?? status
  const nextProgress = draft.progress ?? progress

  async function save() {
    if (typeof nextProgress !== 'number' || !Number.isFinite(nextProgress)) {
      setFeedback({
        type: 'error',
        message: 'Nhập tiến độ từ 0 đến 100 trước khi lưu.',
      })
      return
    }
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
      <div className="task-status-field">
        <span className="sr-only">Trạng thái công việc</span>
        <TaskStatusSelect
          value={nextStatus}
          onChange={(next) =>
            setDraft((current) => ({ ...current, status: next }))
          }
        />
      </div>
      <label>
        <span className="sr-only">Tiến độ</span>
        <input
          type="number"
          min="0"
          max="100"
          value={nextProgress}
          onChange={(event) => {
            const rawValue = event.currentTarget.value
            if (rawValue === '') {
              setDraft((current) => ({ ...current, progress: '' }))
              return
            }
            const parsedValue = event.currentTarget.valueAsNumber
            if (Number.isFinite(parsedValue)) {
              setDraft((current) => ({
                ...current,
                progress: parsedValue,
              }))
            }
          }}
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
