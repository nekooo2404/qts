'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/portal/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  projectSchema,
  type ProjectInput,
  type ProjectOutput,
} from '@/lib/validation/forms'

type OrganizationOption = { id: string; name: string }

const emptyProject: ProjectInput = {
  code: '',
  name: '',
  description: '',
  organizationId: '',
  status: 'PLANNING',
  priority: 'MEDIUM',
  progress: 0,
  startDate: '',
  dueDate: '',
}

export function ProjectForm({
  organizations,
  projectId,
  defaultValues,
}: {
  organizations: OrganizationOption[]
  projectId?: string
  defaultValues?: ProjectInput
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput, unknown, ProjectOutput>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultValues ?? emptyProject,
  })

  async function submit(values: ProjectOutput) {
    setFeedback(null)
    const result = await apiMutation(
      projectId ? `/api/portal/projects/${projectId}` : '/api/portal/projects',
      projectId ? 'PATCH' : 'POST',
      values,
    )
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.errors ?? {}))
        if (messages?.[0])
          setError(field as keyof ProjectInput, { message: messages[0] })
      setFeedback({ type: 'error', message: result.message })
      return
    }
    setFeedback({ type: 'success', message: result.message })
    if (!projectId) reset(emptyProject)
    router.refresh()
  }

  return (
    <form
      className="portal-form form-grid"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="field">
        <label htmlFor={`${projectId ?? 'new'}-project-code`}>Mã dự án</label>
        <input
          id={`${projectId ?? 'new'}-project-code`}
          aria-invalid={Boolean(errors.code)}
          {...register('code')}
        />
        {errors.code && <p className="field__error">{errors.code.message}</p>}
      </div>
      <div className="field">
        <label htmlFor={`${projectId ?? 'new'}-project-name`}>Tên dự án</label>
        <input
          id={`${projectId ?? 'new'}-project-name`}
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name && <p className="field__error">{errors.name.message}</p>}
      </div>
      <div className="field form-grid__full">
        <label htmlFor={`${projectId ?? 'new'}-project-description`}>
          Mô tả
        </label>
        <textarea
          id={`${projectId ?? 'new'}-project-description`}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
        {errors.description && (
          <p className="field__error">{errors.description.message}</p>
        )}
      </div>
      <div className="field">
        <label htmlFor={`${projectId ?? 'new'}-project-organization`}>
          Khách hàng / tổ chức
        </label>
        <select
          id={`${projectId ?? 'new'}-project-organization`}
          aria-invalid={Boolean(errors.organizationId)}
          {...register('organizationId')}
        >
          <option value="">Chọn tổ chức</option>
          {organizations.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {errors.organizationId && (
          <p className="field__error">{errors.organizationId.message}</p>
        )}
      </div>
      <div className="field">
        <label htmlFor={`${projectId ?? 'new'}-project-status`}>
          Trạng thái
        </label>
        <select
          id={`${projectId ?? 'new'}-project-status`}
          {...register('status')}
        >
          <option value="PLANNING">Lập kế hoạch</option>
          <option value="ACTIVE">Đang thực hiện</option>
          <option value="ON_HOLD">Tạm dừng</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${projectId ?? 'new'}-project-priority`}>
          Ưu tiên
        </label>
        <select
          id={`${projectId ?? 'new'}-project-priority`}
          {...register('priority')}
        >
          <option value="LOW">Thấp</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HIGH">Cao</option>
          <option value="URGENT">Khẩn cấp</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${projectId ?? 'new'}-project-progress`}>
          Tiến độ (%)
        </label>
        <input
          id={`${projectId ?? 'new'}-project-progress`}
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
        <label htmlFor={`${projectId ?? 'new'}-project-start`}>
          Ngày bắt đầu
        </label>
        <input
          id={`${projectId ?? 'new'}-project-start`}
          type="date"
          aria-invalid={Boolean(errors.startDate)}
          {...register('startDate')}
        />
        {errors.startDate && (
          <p className="field__error">{errors.startDate.message}</p>
        )}
      </div>
      <div className="field">
        <label htmlFor={`${projectId ?? 'new'}-project-due`}>
          Ngày dự kiến hoàn thành
        </label>
        <input
          id={`${projectId ?? 'new'}-project-due`}
          type="date"
          aria-invalid={Boolean(errors.dueDate)}
          {...register('dueDate')}
        />
        {errors.dueDate && (
          <p className="field__error">{errors.dueDate.message}</p>
        )}
      </div>
      <FormFeedback value={feedback} className="form-grid__full" />
      <div className="form-grid__full portal-form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="is-spinning" size={17} aria-hidden />
          ) : (
            <Save size={17} aria-hidden />
          )}
          {isSubmitting
            ? 'Đang lưu...'
            : projectId
              ? 'Lưu thay đổi'
              : 'Tạo dự án'}
        </Button>
      </div>
    </form>
  )
}
