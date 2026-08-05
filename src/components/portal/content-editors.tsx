'use client'

import { useState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/portal/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  caseStudyAdminSchema,
  serviceAdminSchema,
  siteSettingSchema,
} from '@/lib/validation/forms'

export function ServiceEditor({
  service,
}: {
  service: {
    id: string
    name: string
    summary: string
    description: string
    active: boolean
  }
}) {
  const router = useRouter()
  const [value, setValue] = useState(service)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save() {
    const parsed = serviceAdminSchema.safeParse(value)
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    const result = await apiMutation(
      `/api/portal/admin/services/${service.id}`,
      'PATCH',
      parsed.data,
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) router.refresh()
    setPending(false)
  }
  return (
    <div className="portal-form form-grid">
      <div className="field">
        <label>
          Tên dịch vụ
          <input
            value={value.name}
            onChange={(event) =>
              setValue({ ...value, name: event.target.value })
            }
          />
        </label>
      </div>
      <div className="field">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(event) =>
              setValue({ ...value, active: event.target.checked })
            }
          />
          <span>Hiển thị công khai</span>
        </label>
      </div>
      <div className="field form-grid__full">
        <label>
          Mô tả ngắn
          <textarea
            value={value.summary}
            onChange={(event) =>
              setValue({ ...value, summary: event.target.value })
            }
          />
        </label>
      </div>
      <div className="field form-grid__full">
        <label>
          Mô tả chi tiết
          <textarea
            value={value.description}
            onChange={(event) =>
              setValue({ ...value, description: event.target.value })
            }
          />
        </label>
      </div>
      <FormFeedback value={feedback} className="form-grid__full" />
      <Button onClick={save} disabled={pending}>
        {pending ? (
          <LoaderCircle className="is-spinning" size={16} />
        ) : (
          <Save size={16} />
        )}{' '}
        Lưu dịch vụ
      </Button>
    </div>
  )
}

export function CaseStudyEditor({
  item,
}: {
  item: {
    id: string
    title: string
    excerpt: string
    challenge: string
    solution: string
    outcome: string
    industry: string
    featured: boolean
    publishedAt: string | null
  }
}) {
  const router = useRouter()
  const [value, setValue] = useState({
    ...item,
    published: Boolean(item.publishedAt),
  })
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save() {
    const parsed = caseStudyAdminSchema.safeParse(value)
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    const result = await apiMutation(
      `/api/portal/admin/case-studies/${item.id}`,
      'PATCH',
      parsed.data,
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) router.refresh()
    setPending(false)
  }
  return (
    <div className="portal-form form-grid">
      <div className="field form-grid__full">
        <label>
          Tiêu đề
          <input
            value={value.title}
            onChange={(event) =>
              setValue({ ...value, title: event.target.value })
            }
          />
        </label>
      </div>
      <div className="field">
        <label>
          Lĩnh vực
          <input
            value={value.industry}
            onChange={(event) =>
              setValue({ ...value, industry: event.target.value })
            }
          />
        </label>
      </div>
      <div className="field editor-checks">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.featured}
            onChange={(event) =>
              setValue({ ...value, featured: event.target.checked })
            }
          />
          <span>Nổi bật</span>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.published}
            onChange={(event) =>
              setValue({ ...value, published: event.target.checked })
            }
          />
          <span>Xuất bản</span>
        </label>
      </div>
      <div className="field form-grid__full">
        <label>
          Mô tả ngắn
          <textarea
            value={value.excerpt}
            onChange={(event) =>
              setValue({ ...value, excerpt: event.target.value })
            }
          />
        </label>
      </div>
      <div className="field">
        <label>
          Bài toán
          <textarea
            value={value.challenge}
            onChange={(event) =>
              setValue({ ...value, challenge: event.target.value })
            }
          />
        </label>
      </div>
      <div className="field">
        <label>
          Giải pháp
          <textarea
            value={value.solution}
            onChange={(event) =>
              setValue({ ...value, solution: event.target.value })
            }
          />
        </label>
      </div>
      <div className="field form-grid__full">
        <label>
          Kết quả
          <textarea
            value={value.outcome}
            onChange={(event) =>
              setValue({ ...value, outcome: event.target.value })
            }
          />
        </label>
      </div>
      <FormFeedback value={feedback} className="form-grid__full" />
      <Button onClick={save} disabled={pending}>
        {pending ? (
          <LoaderCircle className="is-spinning" size={16} />
        ) : (
          <Save size={16} />
        )}{' '}
        Lưu case study
      </Button>
    </div>
  )
}

export function SiteSettingEditor({
  setting,
}: {
  setting: { id: string; label: string; value: string }
}) {
  const router = useRouter()
  const [value, setValue] = useState(setting.value)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save() {
    const parsed = siteSettingSchema.safeParse({ value })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Nội dung chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    const result = await apiMutation(
      `/api/portal/admin/settings/${setting.id}`,
      'PATCH',
      parsed.data,
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) router.refresh()
    setPending(false)
  }
  return (
    <div className="portal-form">
      <div className="field">
        <label htmlFor={`setting-${setting.id}`}>{setting.label}</label>
        <textarea
          id={`setting-${setting.id}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <FormFeedback value={feedback} />
      <Button onClick={save} disabled={pending}>
        {pending ? (
          <LoaderCircle className="is-spinning" size={16} />
        ) : (
          <Save size={16} />
        )}{' '}
        Lưu CTA
      </Button>
    </div>
  )
}
