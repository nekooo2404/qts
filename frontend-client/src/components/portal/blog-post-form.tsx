'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FilePenLine, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'
import {
  blogPostSchema,
  type BlogPostInput,
  type BlogPostOutput,
} from '@/lib/validation/forms'

const emptyPost: BlogPostInput = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'DRAFT',
  metaTitle: '',
  metaDescription: '',
}

export function BlogPostForm({
  postId,
  defaultValues,
  readOnly = false,
}: {
  postId?: string
  defaultValues?: BlogPostInput
  readOnly?: boolean
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BlogPostInput, unknown, BlogPostOutput>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: defaultValues ?? emptyPost,
  })
  async function submit(values: BlogPostOutput) {
    setFeedback(null)
    const result = await apiMutation(
      postId ? `/api/portal/admin/blog/${postId}` : '/api/portal/admin/blog',
      postId ? 'PATCH' : 'POST',
      values,
    )
    if (!result.ok)
      for (const [field, messages] of Object.entries(result.errors ?? {}))
        if (messages?.[0])
          setError(field as keyof BlogPostInput, { message: messages[0] })
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) {
      if (!postId) reset(emptyPost)
      router.refresh()
    }
  }
  return (
    <form
      className="portal-form form-grid cms-form"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <fieldset className="portal-form__fieldset form-grid" disabled={readOnly}>
        <div className="field form-grid__full">
          <label htmlFor={`${postId ?? 'new'}-blog-title`}>
            Tiêu đề bài viết
          </label>
          <input
            id={`${postId ?? 'new'}-blog-title`}
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
          {errors.title && (
            <p className="field__error">{errors.title.message}</p>
          )}
        </div>
        <div className="field">
          <label htmlFor={`${postId ?? 'new'}-blog-slug`}>Slug</label>
          <input
            id={`${postId ?? 'new'}-blog-slug`}
            aria-invalid={Boolean(errors.slug)}
            placeholder="ten-bai-viet"
            {...register('slug')}
          />
          {errors.slug && <p className="field__error">{errors.slug.message}</p>}
        </div>
        <div className="field">
          <label htmlFor={`${postId ?? 'new'}-blog-status`}>Trạng thái</label>
          <select id={`${postId ?? 'new'}-blog-status`} {...register('status')}>
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Xuất bản</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>
        <div className="field form-grid__full">
          <label htmlFor={`${postId ?? 'new'}-blog-excerpt`}>Mô tả ngắn</label>
          <textarea
            id={`${postId ?? 'new'}-blog-excerpt`}
            aria-invalid={Boolean(errors.excerpt)}
            {...register('excerpt')}
          />
          {errors.excerpt && (
            <p className="field__error">{errors.excerpt.message}</p>
          )}
        </div>
        <div className="field form-grid__full">
          <label htmlFor={`${postId ?? 'new'}-blog-content`}>Nội dung</label>
          <textarea
            className="cms-content-input"
            id={`${postId ?? 'new'}-blog-content`}
            aria-invalid={Boolean(errors.content)}
            {...register('content')}
          />
          {errors.content && (
            <p className="field__error">{errors.content.message}</p>
          )}
          <p className="field__help">
            Nội dung thuần văn bản; không render HTML tùy ý để tránh XSS.
          </p>
        </div>
        <div className="field">
          <label htmlFor={`${postId ?? 'new'}-blog-meta-title`}>
            SEO title
          </label>
          <input
            id={`${postId ?? 'new'}-blog-meta-title`}
            {...register('metaTitle')}
          />
        </div>
        <div className="field">
          <label htmlFor={`${postId ?? 'new'}-blog-meta-description`}>
            SEO description
          </label>
          <textarea
            id={`${postId ?? 'new'}-blog-meta-description`}
            {...register('metaDescription')}
          />
        </div>
        <FormFeedback value={feedback} className="form-grid__full" />
        <div className="form-grid__full">
          <Button type="submit" disabled={readOnly || isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="is-spinning" size={17} />
            ) : (
              <FilePenLine size={17} />
            )}
            {isSubmitting
              ? 'Đang lưu...'
              : postId
                ? 'Cập nhật bài viết'
                : 'Tạo bài viết'}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
