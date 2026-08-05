import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import { consumeRateLimit } from '@/lib/http/rate-limit'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { sha256 } from '@/lib/security/hash'
import { isSameOriginRequest, requestIp } from '@/lib/security/request'
import { forgotPasswordSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return messageResponse('Yêu cầu không cùng nguồn đã bị từ chối.', 403)
  }

  try {
    const body = await readJsonBody(request)
    const result = forgotPasswordSchema.safeParse(body)

    if (!result.success) {
      return validationErrorResponse(result.error)
    }

    const limit = consumeRateLimit(`forgot:${sha256(requestIp(request))}`, {
      limit: 3,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.allowed) {
      return messageResponse(
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        429,
        { 'Retry-After': String(limit.retryAfterSeconds) },
      )
    }

    const user = await db.user.findUnique({
      where: { email: result.data.email },
      select: { id: true },
    })

    if (user) {
      await recordAudit({
        request,
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id,
      })
    }

    return NextResponse.json({
      ok: true,
      message:
        'Nếu tài khoản tồn tại, hướng dẫn tiếp theo sẽ được gửi qua kênh đã đăng ký.',
    })
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return messageResponse(error.message, 400)
    }

    console.error('Không thể xử lý yêu cầu khôi phục mật khẩu.', error)
    return messageResponse('Không thể xử lý yêu cầu lúc này.', 500)
  }
}
