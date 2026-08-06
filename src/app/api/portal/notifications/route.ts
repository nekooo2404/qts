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
import { notificationComposeSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.notifications.compose'))
    return messageResponse('Bạn không có quyền gửi thông báo hệ thống.', 403)
  try {
    const result = notificationComposeSchema.safeParse(
      await readJsonBody(request),
    )
    if (!result.success) return validationErrorResponse(result.error)
    const canComposeForAll = hasPermission(
      auth.user,
      'portal.notifications.compose.all',
    )
    const recipient = await db.user.findFirst({
      where: {
        id: result.data.userId,
        active: true,
        ...(canComposeForAll ? {} : { role: { name: 'CUSTOMER' } }),
      },
      select: { id: true, organizationId: true },
    })
    if (!recipient) return messageResponse('Người nhận không tồn tại.', 422)
    const notification = await db.notification.create({
      data: {
        userId: recipient.id,
        title: result.data.title,
        message: result.data.message,
        href: result.data.href || null,
        type: 'INFO',
      },
      select: { id: true },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'SEND_NOTIFICATION',
      entity: 'Notification',
      entityId: notification.id,
      metadata: { recipientId: recipient.id },
    })
    revalidatePath('/portal', 'layout')
    return NextResponse.json(
      { ok: true, message: 'Đã gửi thông báo.', data: notification },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể gửi thông báo.', error)
    return messageResponse('Không thể gửi thông báo lúc này.', 500)
  }
}
