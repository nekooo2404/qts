'use client'

import { useState, type FormEvent } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  caseStudyAdminSchema,
  serviceAdminSchema,
  siteSettingSchema,
} from '@/lib/validation/forms'

export function ServiceEditor({
  service,
  readOnly = false,
}: {
  service: {
    id: string
    name: string
    summary: string
    description: string
    active: boolean
  }
  readOnly?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = serviceAdminSchema.safeParse({
      name: formData.get('name'),
      summary: formData.get('summary'),
      description: formData.get('description'),
      active: formData.has('active'),
    })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    try {
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
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể lưu thay đổi. Vui lòng thử lại.',
      })
    } finally {
      setPending(false)
    }
  }
  return (
    <form className="portal-form form-grid" onSubmit={save}>
      <fieldset className="portal-form__fieldset form-grid" disabled={readOnly}>
        <div className="field">
          <label>
            Tên dịch vụ
            <input name="name" defaultValue={service.name} />
          </label>
        </div>
        <div className="field">
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="active"
              defaultChecked={service.active}
            />
            <span>Hiển thị công khai</span>
          </label>
        </div>
        <div className="field form-grid__full">
          <label>
            Mô tả ngắn
            <textarea name="summary" defaultValue={service.summary} />
          </label>
        </div>
        <div className="field form-grid__full">
          <label>
            Mô tả chi tiết
            <textarea name="description" defaultValue={service.description} />
          </label>
        </div>
        <FormFeedback value={feedback} className="form-grid__full" />
        <Button type="submit" disabled={readOnly || pending}>
          {pending ? (
            <LoaderCircle className="is-spinning" size={16} />
          ) : (
            <Save size={16} />
          )}{' '}
          Lưu dịch vụ
        </Button>
      </fieldset>
    </form>
  )
}

export function CaseStudyEditor({
  item,
  readOnly = false,
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
  readOnly?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = caseStudyAdminSchema.safeParse({
      title: formData.get('title'),
      excerpt: formData.get('excerpt'),
      challenge: formData.get('challenge'),
      solution: formData.get('solution'),
      outcome: formData.get('outcome'),
      industry: formData.get('industry'),
      featured: formData.has('featured'),
      published: formData.has('published'),
    })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    try {
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
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể lưu thay đổi. Vui lòng thử lại.',
      })
    } finally {
      setPending(false)
    }
  }
  return (
    <form className="portal-form form-grid" onSubmit={save}>
      <fieldset className="portal-form__fieldset form-grid" disabled={readOnly}>
        <div className="field form-grid__full">
          <label>
            Tiêu đề
            <input name="title" defaultValue={item.title} />
          </label>
        </div>
        <div className="field">
          <label>
            Lĩnh vực
            <input name="industry" defaultValue={item.industry} />
          </label>
        </div>
        <div className="field editor-checks">
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={item.featured}
            />
            <span>Nổi bật</span>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="published"
              defaultChecked={Boolean(item.publishedAt)}
            />
            <span>Xuất bản</span>
          </label>
        </div>
        <div className="field form-grid__full">
          <label>
            Mô tả ngắn
            <textarea name="excerpt" defaultValue={item.excerpt} />
          </label>
        </div>
        <div className="field">
          <label>
            Bài toán
            <textarea name="challenge" defaultValue={item.challenge} />
          </label>
        </div>
        <div className="field">
          <label>
            Giải pháp
            <textarea name="solution" defaultValue={item.solution} />
          </label>
        </div>
        <div className="field form-grid__full">
          <label>
            Kết quả
            <textarea name="outcome" defaultValue={item.outcome} />
          </label>
        </div>
        <FormFeedback value={feedback} className="form-grid__full" />
        <Button type="submit" disabled={readOnly || pending}>
          {pending ? (
            <LoaderCircle className="is-spinning" size={16} />
          ) : (
            <Save size={16} />
          )}{' '}
          Lưu case study
        </Button>
      </fieldset>
    </form>
  )
}

export function SiteSettingEditor({
  setting,
  readOnly = false,
}: {
  setting: { id: string; label: string; value: string }
  readOnly?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = siteSettingSchema.safeParse({ value: formData.get('value') })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message: parsed.error.issues[0]?.message ?? 'Nội dung chưa hợp lệ.',
      })
      return
    }
    setPending(true)
    try {
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
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể lưu thay đổi. Vui lòng thử lại.',
      })
    } finally {
      setPending(false)
    }
  }
  return (
    <form className="portal-form" onSubmit={save}>
      <fieldset className="portal-form__fieldset" disabled={readOnly}>
        <div className="field">
          <label htmlFor={`setting-${setting.id}`}>{setting.label}</label>
          <textarea
            id={`setting-${setting.id}`}
            name="value"
            defaultValue={setting.value}
          />
        </div>
        <FormFeedback value={feedback} />
        <Button type="submit" disabled={readOnly || pending}>
          {pending ? (
            <LoaderCircle className="is-spinning" size={16} />
          ) : (
            <Save size={16} />
          )}{' '}
          Lưu CTA
        </Button>
      </fieldset>
    </form>
  )
}
