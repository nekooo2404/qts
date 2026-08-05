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
import { serviceAdminSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/admin/services/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role !== 'ADMIN')
    return messageResponse('Bạn không có quyền quản lý nội dung.', 403)
  const { id } = await context.params
  try {
    const result = serviceAdminSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const updated = await db.service.updateMany({
      where: { id },
      data: result.data,
    })
    if (!updated.count) return messageResponse('Không tìm thấy dịch vụ.', 404)
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_SERVICE',
      entity: 'Service',
      entityId: id,
    })
    revalidatePath('/dich-vu')
    revalidatePath('/portal/admin/content')
    return NextResponse.json({ ok: true, message: 'Đã cập nhật dịch vụ.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể cập nhật dịch vụ.', error)
    return messageResponse('Không thể cập nhật dịch vụ lúc này.', 500)
  }
}
