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
import { projectScope } from '@backend/server/repositories/portal'
import { taskSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.tasks.create'))
    return messageResponse('Bạn không có quyền tạo công việc.', 403)

  try {
    const result = taskSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const project = await db.project.findFirst({
      where: { AND: [projectScope(auth.user), { id: result.data.projectId }] },
      select: { id: true },
    })
    if (!project)
      return messageResponse(
        'Dự án không tồn tại hoặc nằm ngoài phạm vi của bạn.',
        404,
      )

    if (result.data.assigneeId) {
      const member = await db.projectMember.findFirst({
        where: { projectId: project.id, userId: result.data.assigneeId },
      })
      if (!member)
        return messageResponse('Người phụ trách chưa thuộc dự án.', 422)
    }
    if (result.data.milestoneId) {
      const milestone = await db.milestone.findFirst({
        where: { id: result.data.milestoneId, projectId: project.id },
      })
      if (!milestone)
        return messageResponse('Mốc công việc không thuộc dự án.', 422)
    }

    const task = await db.task.create({
      data: {
        projectId: project.id,
        title: result.data.title,
        description: result.data.description || null,
        status: result.data.status,
        priority: result.data.priority,
        progress: result.data.status === 'DONE' ? 100 : result.data.progress,
        assigneeId: result.data.assigneeId || null,
        milestoneId: result.data.milestoneId || null,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        createdById: auth.user.id,
      },
      select: { id: true },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'CREATE_TASK',
      entity: 'Task',
      entityId: task.id,
    })
    revalidatePath('/portal/tasks')
    return NextResponse.json(
      { ok: true, message: 'Đã tạo công việc.', data: task },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể tạo công việc.', error)
    return messageResponse('Không thể tạo công việc lúc này.', 500)
  }
}
