import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { authorizeMutation } from '@/lib/auth/api'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.notifications.manage'))
    return Response.json(
      { ok: false, message: 'Không có quyền cập nhật thông báo.' },
      { status: 403 },
    )

  await db.notification.updateMany({
    where: { userId: auth.user.id, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath('/portal', 'layout')

  return NextResponse.json({
    ok: true,
    message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
  })
}
