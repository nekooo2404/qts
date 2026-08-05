import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { blogPostSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/admin/blog/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role !== 'ADMIN')
    return messageResponse('Bạn không có quyền quản lý nội dung.', 403)
  const { id } = await context.params
  try {
    const current = await db.blogPost.findUnique({
      where: { id },
      select: { id: true, publishedAt: true },
    })
    if (!current) return messageResponse('Không tìm thấy bài viết.', 404)
    const result = blogPostSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    await db.blogPost.update({
      where: { id },
      data: {
        title: result.data.title,
        slug: result.data.slug,
        excerpt: result.data.excerpt,
        content: result.data.content,
        status: result.data.status,
        metaTitle: result.data.metaTitle || null,
        metaDescription: result.data.metaDescription || null,
        publishedAt:
          result.data.status === 'PUBLISHED'
            ? (current.publishedAt ?? new Date())
            : null,
      },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_BLOG_POST',
      entity: 'BlogPost',
      entityId: id,
      metadata: { status: result.data.status },
    })
    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath('/portal/admin/content')
    return NextResponse.json({ ok: true, message: 'Đã cập nhật bài viết.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2002'
    )
      return messageResponse('Slug đã được sử dụng.', 409)
    console.error('Không thể cập nhật bài viết.', error)
    return messageResponse('Không thể cập nhật bài viết lúc này.', 500)
  }
}
