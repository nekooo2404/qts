'use client'

import { useState } from 'react'
import { FileUp, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import { documentSchema } from '@/lib/validation/forms'

const allowedTypes = '.pdf,.txt,.png,.jpg,.jpeg,.docx'

export function FileUploader({
  organizations,
  projects,
}: {
  organizations: { id: string; name: string }[]
  projects: { id: string; name: string; organizationId: string }[]
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('PROJECT_DOCUMENT')
  const [organizationId, setOrganizationId] = useState(
    organizations[0]?.id ?? '',
  )
  const [projectId, setProjectId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)

  async function upload() {
    setFeedback(null)
    if (!file) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn tệp.' })
      return
    }
    const parsed = documentSchema.safeParse({
      name,
      type,
      organizationId,
      projectId,
      fileName: file.name,
      mimeType: file.type || 'text/plain',
      size: file.size,
    })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Tệp chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    const result = await apiMutation(
      '/api/portal/documents',
      'POST',
      parsed.data,
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) {
      setName('')
      setFile(null)
      router.refresh()
    }
    setPending(false)
  }

  const visibleProjects = projects.filter(
    (project) => project.organizationId === organizationId,
  )
  return (
    <div className="file-uploader portal-form">
      <div className="file-uploader__note">
        <FileUp size={19} aria-hidden />
        <div>
          <strong>Upload demo có kiểm soát</strong>
          <span>
            Kiểm tra loại tệp và giới hạn 5 MB. Bản local chỉ lưu metadata,
            không lưu nội dung tệp.
          </span>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="document-name">Tên hiển thị</label>
          <input
            id="document-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="document-type">Loại tài liệu</label>
          <select
            id="document-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="PROJECT_DOCUMENT">Tài liệu dự án</option>
            <option value="MINUTES">Biên bản</option>
            <option value="GUIDE">Hướng dẫn</option>
            <option value="REPORT">Báo cáo</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="document-organization">Tổ chức</label>
          <select
            id="document-organization"
            value={organizationId}
            onChange={(event) => {
              setOrganizationId(event.target.value)
              setProjectId('')
            }}
          >
            {organizations.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="document-project">Dự án</label>
          <select
            id="document-project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Không gắn dự án</option>
            {visibleProjects.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field form-grid__full">
          <label htmlFor="document-file">Tệp đính kèm</label>
          <input
            id="document-file"
            type="file"
            accept={allowedTypes}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="field__help">
            PDF, TXT, PNG, JPG hoặc DOCX; tối đa 5 MB.
          </p>
        </div>
      </div>
      <FormFeedback value={feedback} />
      <Button onClick={upload} disabled={pending}>
        {pending ? (
          <LoaderCircle className="is-spinning" size={17} />
        ) : (
          <FileUp size={17} />
        )}
        {pending ? 'Đang xử lý...' : 'Lưu tài liệu demo'}
      </Button>
    </div>
  )
}
