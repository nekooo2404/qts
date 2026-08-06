import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { authorizeMutation } from '@/lib/auth/api'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  context: RouteContext<'/api/portal/notifications/[id]/read'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.notifications.manage'))
    return Response.json(
      { ok: false, message: 'Không có quyền cập nhật thông báo.' },
      { status: 403 },
    )
  const { id } = await context.params

  const result = await db.notification.updateMany({
    where: { id, userId: auth.user.id },
    data: { readAt: new Date() },
  })
  if (!result.count) {
    return NextResponse.json(
      { ok: false, message: 'Không tìm thấy thông báo.' },
      { status: 404 },
    )
  }

  revalidatePath('/portal', 'layout')
  return NextResponse.json({
    ok: true,
    message: 'Đã đánh dấu thông báo là đã đọc.',
  })
}
