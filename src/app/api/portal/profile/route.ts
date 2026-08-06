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
import { profileSchema } from '@/lib/validation/forms'

export async function PATCH(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.profile.update'))
    return messageResponse('Không có quyền cập nhật hồ sơ.', 403)
  try {
    const result = profileSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    await db.user.update({
      where: { id: auth.user.id },
      data: {
        name: result.data.name,
        phone: result.data.phone || null,
        title: result.data.title || null,
      },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_PROFILE',
      entity: 'User',
      entityId: auth.user.id,
    })
    revalidatePath('/portal', 'layout')
    return NextResponse.json({ ok: true, message: 'Đã cập nhật hồ sơ.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể cập nhật hồ sơ.', error)
    return messageResponse('Không thể cập nhật hồ sơ lúc này.', 500)
  }
}
