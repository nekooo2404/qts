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
import { contactSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return messageResponse('Yêu cầu không cùng nguồn đã bị từ chối.', 403)
  }

  try {
    const body = await readJsonBody(request)
    const result = contactSchema.safeParse(body)

    if (!result.success) {
      return validationErrorResponse(result.error)
    }

    const limit = consumeRateLimit(`contact:${sha256(requestIp(request))}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    })

    if (!limit.allowed) {
      return messageResponse(
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        429,
        { 'Retry-After': String(limit.retryAfterSeconds) },
      )
    }

    const lead = await db.contactLead.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        company: result.data.company || null,
        message: result.data.message,
      },
      select: { id: true },
    })

    await recordAudit({
      request,
      action: 'CONTACT_LEAD_CREATED',
      entity: 'ContactLead',
      entityId: lead.id,
    })

    return NextResponse.json(
      {
        ok: true,
        message: 'QTS đã nhận thông tin và sẽ phản hồi qua kênh bạn cung cấp.',
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return messageResponse(error.message, 400)
    }

    console.error('Không thể lưu yêu cầu liên hệ.', error)
    return messageResponse(
      'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.',
      500,
    )
  }
}
