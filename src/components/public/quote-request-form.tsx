'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, CircleCheck, Clock3, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FieldMessage } from '@/components/public/field-message'
import {
  quoteSchema,
  type QuoteFormValues,
  type QuoteInput,
} from '@/lib/validation/forms'

type QuoteRequestFormProps = {
  compact?: boolean
}

type FormStatus = { type: 'success' | 'error'; message: string } | null
type FormResponse = {
  message?: string
  errors?: Record<string, string[] | undefined>
}

export function QuoteRequestForm({ compact = false }: QuoteRequestFormProps) {
  const [status, setStatus] = useState<FormStatus>(null)
  const fieldPrefix = compact ? 'quick' : 'quote'
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues, unknown, QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      service: compact ? 'Giải pháp theo yêu cầu' : '',
      budget: '',
      timeline: compact ? 'Chưa xác định' : '',
      needs: '',
      website: '',
      consent: false,
    },
  })

  async function onSubmit(values: QuoteInput) {
    setStatus(null)

    try {
      const response = await fetch('/api/public/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = (await response.json()) as FormResponse
        if (payload.errors) {
          for (const [field, messages] of Object.entries(payload.errors)) {
            if (messages?.[0] && field in values) {
              setError(field as keyof QuoteFormValues, { message: messages[0] })
            }
          }
        }
        setStatus({
          type: 'error',
          message: payload.message ?? 'Không thể gửi yêu cầu lúc này.',
        })
        return
      }

      const payload = (await response.json()) as FormResponse
      setStatus({
        type: 'success',
        message: payload.message ?? 'QTS đã nhận yêu cầu báo giá.',
      })
      reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: compact ? 'Giải pháp theo yêu cầu' : '',
        budget: '',
        timeline: compact ? 'Chưa xác định' : '',
        needs: '',
        website: '',
        consent: false,
      })
    } catch {
      setStatus({
        type: 'error',
        message: 'Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.',
      })
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="field">
        <label htmlFor={`${fieldPrefix}-name`}>Họ và tên</label>
        <input
          id={`${fieldPrefix}-name`}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={`${fieldPrefix}-name-error`}
          {...register('name')}
        />
        <FieldMessage
          id={`${fieldPrefix}-name-error`}
          message={errors.name?.message}
        />
      </div>
      <div className="field">
        <label htmlFor={`${fieldPrefix}-company`}>Công ty</label>
        <input
          id={`${fieldPrefix}-company`}
          autoComplete="organization"
          aria-invalid={Boolean(errors.company)}
          aria-describedby={`${fieldPrefix}-company-error`}
          {...register('company')}
        />
        <FieldMessage
          id={`${fieldPrefix}-company-error`}
          message={errors.company?.message}
        />
      </div>
      <div className="field">
        <label htmlFor={`${fieldPrefix}-phone`}>Số điện thoại</label>
        <input
          id={`${fieldPrefix}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={`${fieldPrefix}-phone-error`}
          {...register('phone')}
        />
        <FieldMessage
          id={`${fieldPrefix}-phone-error`}
          message={errors.phone?.message}
        />
      </div>
      <div className="field">
        <label htmlFor={`${fieldPrefix}-email`}>Email</label>
        <input
          id={`${fieldPrefix}-email`}
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={`${fieldPrefix}-email-error`}
          {...register('email')}
        />
        <FieldMessage
          id={`${fieldPrefix}-email-error`}
          message={errors.email?.message}
        />
      </div>
      {!compact && (
        <>
          <div className="field">
            <label htmlFor="quote-service">Nhu cầu</label>
            <select
              id="quote-service"
              aria-invalid={Boolean(errors.service)}
              aria-describedby="quote-service-error"
              {...register('service')}
            >
              <option value="">Chọn dịch vụ</option>
              <option>Thiết kế website</option>
              <option>Phát triển phần mềm</option>
              <option>Tích hợp hệ thống</option>
              <option>Bảo trì và vận hành</option>
              <option>Giải pháp theo yêu cầu</option>
            </select>
            <FieldMessage
              id="quote-service-error"
              message={errors.service?.message}
            />
          </div>
          <div className="field">
            <label htmlFor="quote-timeline">Thời gian dự kiến</label>
            <select
              id="quote-timeline"
              aria-invalid={Boolean(errors.timeline)}
              aria-describedby="quote-timeline-error"
              {...register('timeline')}
            >
              <option value="">Chọn thời gian</option>
              <option>Dưới 3 tháng</option>
              <option>3-6 tháng</option>
              <option>6-12 tháng</option>
              <option>Chưa xác định</option>
            </select>
            <FieldMessage
              id="quote-timeline-error"
              message={errors.timeline?.message}
            />
          </div>
        </>
      )}
      <div className="field form-grid__full">
        <label htmlFor={`${fieldPrefix}-budget`}>Ngân sách dự kiến</label>
        <select
          id={`${fieldPrefix}-budget`}
          aria-invalid={Boolean(errors.budget)}
          aria-describedby={`${fieldPrefix}-budget-error`}
          {...register('budget')}
        >
          <option value="">Chọn khoảng ngân sách</option>
          <option>Dưới 100 triệu</option>
          <option>100-200 triệu</option>
          <option>200-500 triệu</option>
          <option>Trên 500 triệu</option>
          <option>Cần QTS tư vấn</option>
        </select>
        <FieldMessage
          id={`${fieldPrefix}-budget-error`}
          message={errors.budget?.message}
        />
      </div>
      <div className="field form-grid__full">
        <label htmlFor={`${fieldPrefix}-needs`}>Nội dung trao đổi</label>
        <textarea
          id={`${fieldPrefix}-needs`}
          aria-invalid={Boolean(errors.needs)}
          aria-describedby={`${fieldPrefix}-needs-error`}
          placeholder="Mô tả bài toán, người dùng chính và kết quả bạn mong đợi."
          {...register('needs')}
        />
        <FieldMessage
          id={`${fieldPrefix}-needs-error`}
          message={errors.needs?.message}
        />
      </div>
      {compact && (
        <>
          <input type="hidden" {...register('service')} />
          <input type="hidden" {...register('timeline')} />
        </>
      )}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${fieldPrefix}-website`}>Website</label>
        <input
          id={`${fieldPrefix}-website`}
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>
      <div className="form-grid__full">
        <label className="checkbox-field">
          <input
            type="checkbox"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={`${fieldPrefix}-consent-error`}
            {...register('consent')}
          />
          <span>
            Tôi đồng ý QTS sử dụng thông tin này để phản hồi yêu cầu theo{' '}
            <Link className="inline-link" href="/chinh-sach-bao-mat">
              chính sách dữ liệu
            </Link>
            .
          </span>
        </label>
        <FieldMessage
          id={`${fieldPrefix}-consent-error`}
          message={errors.consent?.message}
        />
      </div>
      {status && (
        <p
          className={`form-message form-message--${status.type} form-grid__full`}
          role={status.type === 'error' ? 'alert' : 'status'}
        >
          {status.type === 'success' ? (
            <CircleCheck size={18} aria-hidden="true" />
          ) : (
            <CircleAlert size={18} aria-hidden="true" />
          )}
          {status.message}
        </p>
      )}
      <div className="form-grid__full">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (
            <Clock3 size={18} aria-hidden="true" />
          ) : (
            <Send size={18} aria-hidden="true" />
          )}
          {isSubmitting
            ? 'Đang gửi…'
            : compact
              ? 'Gửi yêu cầu tư vấn'
              : 'Gửi yêu cầu báo giá'}
        </Button>
      </div>
    </form>
  )
}
