'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, CircleCheck, Clock3, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { ConsentField } from '@client/components/public/consent-field'
import { FieldMessage } from '@client/components/public/field-message'
import {
  contactSchema,
  type ContactFormValues,
  type ContactInput,
} from '@/lib/validation/forms'

type FormStatus = { type: 'success' | 'error'; message: string } | null
type FormResponse = {
  message?: string
  errors?: Record<string, string[] | undefined>
}

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues, unknown, ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
      website: '',
      consent: false,
    },
  })
  const [status, setStatus] = useState<FormStatus>(null)

  async function onSubmit(values: ContactInput) {
    setStatus(null)

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = (await response.json()) as FormResponse
        if (payload.errors) {
          for (const [field, messages] of Object.entries(payload.errors)) {
            if (messages?.[0] && field in values) {
              setError(field as keyof ContactFormValues, {
                message: messages[0],
              })
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
        message: payload.message ?? 'QTS đã nhận thông tin.',
      })
      reset()
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
        <label htmlFor="contact-name">Họ và tên</label>
        <input
          id="contact-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby="contact-name-error"
          {...register('name')}
        />
        <FieldMessage id="contact-name-error" message={errors.name?.message} />
      </div>
      <div className="field">
        <label htmlFor="contact-company">Công ty / tổ chức</label>
        <input
          id="contact-company"
          autoComplete="organization"
          aria-invalid={Boolean(errors.company)}
          aria-describedby="contact-company-error"
          {...register('company')}
        />
        <FieldMessage
          id="contact-company-error"
          message={errors.company?.message}
        />
      </div>
      <div className="field">
        <label htmlFor="contact-phone">Số điện thoại</label>
        <input
          id="contact-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby="contact-phone-error"
          {...register('phone')}
        />
        <FieldMessage
          id="contact-phone-error"
          message={errors.phone?.message}
        />
      </div>
      <div className="field">
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby="contact-email-error"
          {...register('email')}
        />
        <FieldMessage
          id="contact-email-error"
          message={errors.email?.message}
        />
      </div>
      <div className="field form-grid__full">
        <label htmlFor="contact-message">Nhu cầu trao đổi</label>
        <textarea
          id="contact-message"
          aria-invalid={Boolean(errors.message)}
          aria-describedby="contact-message-error"
          placeholder="Mô tả ngắn bài toán, người dùng và thời gian dự kiến."
          {...register('message')}
        />
        <FieldMessage
          id="contact-message-error"
          message={errors.message?.message}
        />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>
      <div className="form-grid__full">
        <ConsentField
          id="contact-consent"
          errorId="contact-consent-error"
          registration={register('consent')}
          invalid={Boolean(errors.consent)}
        />
        <FieldMessage
          id="contact-consent-error"
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
          {isSubmitting ? 'Đang gửi…' : 'Gửi yêu cầu liên hệ'}
        </Button>
      </div>
    </form>
  )
}
