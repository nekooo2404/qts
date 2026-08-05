import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { authorizeMutation } from '@/lib/auth/api'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error

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
