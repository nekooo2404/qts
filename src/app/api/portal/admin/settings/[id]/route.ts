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
import { siteSettingSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/admin/settings/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role !== 'ADMIN')
    return messageResponse('Bạn không có quyền quản lý nội dung.', 403)
  const { id } = await context.params
  try {
    const result = siteSettingSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const updated = await db.siteSetting.updateMany({
      where: { id },
      data: result.data,
    })
    if (!updated.count)
      return messageResponse('Không tìm thấy nội dung CTA.', 404)
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_SITE_SETTING',
      entity: 'SiteSetting',
      entityId: id,
    })
    revalidatePath('/')
    revalidatePath('/portal/admin/content')
    return NextResponse.json({ ok: true, message: 'Đã cập nhật nội dung CTA.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể cập nhật CTA.', error)
    return messageResponse('Không thể cập nhật CTA lúc này.', 500)
  }
}
