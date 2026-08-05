import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { canManageProjects } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { projectScope } from '@/server/repositories/portal'
import { projectSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/projects/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!canManageProjects(auth.user.role))
    return messageResponse('Bạn không có quyền cập nhật dự án.', 403)
  const { id } = await context.params

  try {
    const current = await db.project.findFirst({
      where: { AND: [projectScope(auth.user), { id }] },
      select: { id: true },
    })
    if (!current)
      return messageResponse(
        'Không tìm thấy dự án hoặc bạn không có quyền truy cập.',
        404,
      )
    const result = projectSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)

    const organization = await db.organization.findUnique({
      where: { id: result.data.organizationId },
      select: { id: true },
    })
    if (!organization)
      return messageResponse('Khách hàng đã chọn không tồn tại.', 422)
    await db.project.update({
      where: { id },
      data: {
        code: result.data.code,
        name: result.data.name,
        description: result.data.description,
        status: result.data.status,
        priority: result.data.priority,
        progress: result.data.progress,
        startDate: result.data.startDate
          ? new Date(result.data.startDate)
          : null,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        organizationId: result.data.organizationId,
      },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_PROJECT',
      entity: 'Project',
      entityId: id,
    })
    revalidatePath('/portal/projects')
    revalidatePath(`/portal/projects/${id}`)
    return NextResponse.json({ ok: true, message: 'Đã cập nhật dự án.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2002'
    )
      return messageResponse('Mã dự án đã được sử dụng.', 409)
    console.error('Không thể cập nhật dự án.', error)
    return messageResponse('Không thể cập nhật dự án lúc này.', 500)
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext<'/api/portal/projects/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role !== 'ADMIN')
    return messageResponse('Chỉ quản trị viên được xóa dự án.', 403)
  const { id } = await context.params
  const current = await db.project.findUnique({
    where: { id },
    select: { id: true, code: true },
  })
  if (!current) return messageResponse('Không tìm thấy dự án.', 404)

  await db.project.delete({ where: { id } })
  await recordAudit({
    request,
    userId: auth.user.id,
    action: 'DELETE_PROJECT',
    entity: 'Project',
    entityId: id,
    metadata: { code: current.code },
  })
  revalidatePath('/portal/projects')
  return NextResponse.json({ ok: true, message: 'Đã xóa dự án.' })
}
