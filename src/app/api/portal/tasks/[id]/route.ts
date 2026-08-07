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
import { taskScope } from '@backend/server/repositories/portal'
import { taskUpdateSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/tasks/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.tasks.update'))
    return messageResponse('Bạn không có quyền cập nhật công việc.', 403)
  const { id } = await context.params

  try {
    const result = taskUpdateSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const updated = await db.$transaction(
      (tx) =>
        tx.task.updateMany({
          where: { AND: [taskScope(auth.user), { id }] },
          data: {
            status: result.data.status,
            progress:
              result.data.status === 'DONE' ? 100 : result.data.progress,
          },
        }),
      { isolationLevel: 'Serializable' },
    )
    if (updated.count !== 1)
      return messageResponse(
        'Không tìm thấy công việc hoặc bạn không còn quyền truy cập.',
        404,
      )
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
