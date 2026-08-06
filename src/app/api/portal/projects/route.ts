import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { projectSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.projects.create'))
    return messageResponse('Bạn không có quyền tạo dự án.', 403)

  try {
    const result = projectSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)

    const canCreateInOrganization =
      hasPermission(auth.user, 'portal.projects.assign.all') ||
      auth.user.organizationId === result.data.organizationId
    if (!canCreateInOrganization)
      return messageResponse(
        'Bạn không có quyền tạo dự án cho tổ chức này.',
        403,
      )

    const organization = await db.organization.findUnique({
      where: { id: result.data.organizationId },
      select: { id: true },
    })
    if (!organization)
      return messageResponse('Khách hàng đã chọn không tồn tại.', 422)

    const project = await db.project.create({
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
        createdById: auth.user.id,
        members:
          auth.user.role === 'STAFF'
            ? { create: { userId: auth.user.id, title: 'Quản lý dự án' } }
            : undefined,
      },
      select: { id: true },
    })

    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: project.id,
    })
    revalidatePath('/portal/projects')
    return NextResponse.json(
      { ok: true, message: 'Đã tạo dự án.', data: project },
      { status: 201 },
    )
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
    console.error('Không thể tạo dự án.', error)
    return messageResponse('Không thể tạo dự án lúc này.', 500)
  }
}
