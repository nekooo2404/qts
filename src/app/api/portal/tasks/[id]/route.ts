import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { canManageTasks } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { taskScope } from '@/server/repositories/portal'
import { taskUpdateSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/tasks/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!canManageTasks(auth.user.role))
    return messageResponse('Bạn không có quyền cập nhật công việc.', 403)
  const { id } = await context.params

  try {
    const task = await db.task.findFirst({
      where: { AND: [taskScope(auth.user), { id }] },
      select: { id: true },
    })
    if (!task)
      return messageResponse(
        'Không tìm thấy công việc hoặc bạn không có quyền truy cập.',
        404,
      )
    const result = taskUpdateSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    await db.task.update({
      where: { id },
      data: {
        status: result.data.status,
        progress: result.data.status === 'DONE' ? 100 : result.data.progress,
      },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_TASK',
      entity: 'Task',
      entityId: id,
      metadata: result.data,
    })
    revalidatePath('/portal/tasks')
    return NextResponse.json({ ok: true, message: 'Đã cập nhật công việc.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể cập nhật công việc.', error)
    return messageResponse('Không thể cập nhật công việc lúc này.', 500)
  }
}
