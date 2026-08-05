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
import { caseStudyAdminSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/admin/case-studies/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role !== 'ADMIN')
    return messageResponse('Bạn không có quyền quản lý nội dung.', 403)
  const { id } = await context.params
  try {
    const result = caseStudyAdminSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const current = await db.caseStudy.findUnique({
      where: { id },
      select: { publishedAt: true },
    })
    if (!current) return messageResponse('Không tìm thấy case study.', 404)
    const { published, ...data } = result.data
    await db.caseStudy.update({
      where: { id },
      data: {
        ...data,
        publishedAt: published ? (current.publishedAt ?? new Date()) : null,
      },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_CASE_STUDY',
      entity: 'CaseStudy',
      entityId: id,
      metadata: { published },
    })
    revalidatePath('/')
    revalidatePath('/du-an')
    revalidatePath('/portal/admin/content')
    return NextResponse.json({ ok: true, message: 'Đã cập nhật case study.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể cập nhật case study.', error)
    return messageResponse('Không thể cập nhật case study lúc này.', 500)
  }
}
