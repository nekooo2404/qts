import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { destroyCurrentSession, getCurrentUser } from '@/lib/auth/session'
import { messageResponse } from '@/lib/http/response'
import { isSameOriginRequest } from '@/lib/security/request'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return messageResponse('Yêu cầu không cùng nguồn đã bị từ chối.', 403)
  }

  const user = await getCurrentUser()
  await destroyCurrentSession()

  if (user) {
    await recordAudit({
      request,
      userId: user.id,
      action: 'LOGOUT',
      entity: 'Session',
    })
  }

  return NextResponse.json({ ok: true, message: 'Đã đăng xuất.' })
}
