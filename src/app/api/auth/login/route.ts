import { compare } from 'bcryptjs'
import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { createSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { clearRateLimit, consumeRateLimit } from '@/lib/http/rate-limit'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { sha256 } from '@/lib/security/hash'
import {
  isSameOriginRequest,
  requestIp,
  sanitizeNextPath,
} from '@/lib/security/request'
import { loginSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return messageResponse('Yêu cầu không cùng nguồn đã bị từ chối.', 403)
  }

  try {
    const body = await readJsonBody(request)
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return validationErrorResponse(result.error)
    }

    const rateLimitKey = `login:${sha256(`${requestIp(request)}:${result.data.email}`)}`
    const limit = consumeRateLimit(rateLimitKey, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.allowed) {
      return messageResponse(
        'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.',
        429,
        { 'Retry-After': String(limit.retryAfterSeconds) },
      )
    }

    const user = await db.user.findUnique({
      where: { email: result.data.email },
      select: { id: true, passwordHash: true, active: true },
    })
    const validPassword = user
      ? await compare(result.data.password, user.passwordHash)
      : false

    if (!user || !user.active || !validPassword) {
      await recordAudit({
        request,
        action: 'LOGIN_FAILED',
        entity: 'Session',
        metadata: { emailHash: sha256(result.data.email) },
      })
      return messageResponse('Email hoặc mật khẩu không đúng.', 401)
    }

    clearRateLimit(rateLimitKey)
    await createSession(user.id, request)
    await recordAudit({
      request,
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'Session',
    })

    const nextValue =
      typeof body === 'object' && body !== null && 'next' in body
        ? body.next
        : undefined

    return NextResponse.json({
      ok: true,
      message: 'Đăng nhập thành công.',
      redirectTo: sanitizeNextPath(nextValue),
    })
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return messageResponse(error.message, 400)
    }

    console.error('Đăng nhập thất bại do lỗi hệ thống.', error)
    return messageResponse(
      'Không thể đăng nhập lúc này. Vui lòng thử lại.',
      500,
    )
  }
}
