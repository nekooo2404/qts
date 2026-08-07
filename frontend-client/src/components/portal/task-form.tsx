'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@client/components/portal/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  taskSchema,
  type TaskInput,
  type TaskOutput,
} from '@/lib/validation/forms'

type ProjectOption = {
  id: string
  name: string
  members: { user: { id: string; name: string } }[]
  milestones: { id: string; name: string }[]
}

const emptyTask: TaskInput = {
  projectId: '',
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  progress: 0,
  assigneeId: '',
  milestoneId: '',
  dueDate: '',
}

export function TaskForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput, unknown, TaskOutput>({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyTask,
  })
  const selectedId = useWatch({ control, name: 'projectId' })
  const selected = projects.find((project) => project.id === selectedId)

  async function submit(values: TaskOutput) {
    setFeedback(null)
    const result = await apiMutation('/api/portal/tasks', 'POST', values)
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.errors ?? {}))
        if (messages?.[0])
          setError(field as keyof TaskInput, { message: messages[0] })
      setFeedback({ type: 'error', message: result.message })
      return
    }
    setFeedback({ type: 'success', message: result.message })
    reset(emptyTask)
    router.refresh()
  }

  return (
    <form
      className="portal-form form-grid"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="field">
        <label htmlFor="task-project">Dự án</label>
        <select
          id="task-project"
          aria-invalid={Boolean(errors.projectId)}
          {...register('projectId')}
        >
          <option value="">Chọn dự án</option>
          {projects.map((project) => (
            <option value={project.id} key={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {errors.projectId && (
          <p className="field__error">{errors.projectId.message}</p>
        )}
      </div>
      <div className="field">
        <label htmlFor="task-title">Tên công việc</label>
        <input
          id="task-title"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
        {errors.title && <p className="field__error">{errors.title.message}</p>}
      </div>
      <div className="field form-grid__full">
        <label htmlFor="task-description">Mô tả</label>
        <textarea id="task-description" {...register('description')} />
      </div>
      <div className="field">
        <label htmlFor="task-assignee">Người phụ trách</label>
        <select id="task-assignee" {...register('assigneeId')}>
          <option value="">Chưa phân công</option>
          {selected?.members.map(({ user }) => (
            <option value={user.id} key={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="task-milestone">Milestone</label>
        <select id="task-milestone" {...register('milestoneId')}>
          <option value="">Không gắn milestone</option>
          {selected?.milestones.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="task-status">Trạng thái</label>
        <select id="task-status" {...register('status')}>
          <option value="TODO">Cần làm</option>
          <option value="IN_PROGRESS">Đang xử lý</option>
          <option value="REVIEW">Đang duyệt</option>
          <option value="BLOCKED">Đang vướng</option>
          <option value="DONE">Hoàn tất</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="task-priority">Ưu tiên</label>
        <select id="task-priority" {...register('priority')}>
          <option value="LOW">Thấp</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HIGH">Cao</option>
          <option value="URGENT">Khẩn cấp</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="task-progress">Tiến độ (%)</label>
        <input
          id="task-progress"
          type="number"
          min="0"
          max="100"
          aria-invalid={Boolean(errors.progress)}
          {...register('progress')}
        />
        {errors.progress && (
          <p className="field__error">{errors.progress.message}</p>
        )}
      </div>
      <div className="field">
        <label htmlFor="task-due">Deadline</label>
        <input id="task-due" type="date" {...register('dueDate')} />
      </div>
      <FormFeedback value={feedback} className="form-grid__full" />
      <div className="form-grid__full portal-form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="is-spinning" size={17} aria-hidden />
          ) : (
            <Plus size={17} aria-hidden />
          )}
          {isSubmitting ? 'Đang tạo...' : 'Tạo công việc'}
        </Button>
      </div>
    </form>
  )
}
