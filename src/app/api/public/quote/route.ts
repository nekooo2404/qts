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
import { quoteSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return messageResponse('Yêu cầu không cùng nguồn đã bị từ chối.', 403)
  }

  try {
    const body = await readJsonBody(request)
    const result = quoteSchema.safeParse(body)

    if (!result.success) {
      return validationErrorResponse(result.error)
    }

    const limit = consumeRateLimit(`quote:${sha256(requestIp(request))}`, {
      limit: 4,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.allowed) {
      return messageResponse(
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        429,
        { 'Retry-After': String(limit.retryAfterSeconds) },
      )
    }

    const quote = await db.quoteRequest.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        company: result.data.company,
        service: result.data.service,
        budget: result.data.budget,
        timeline: result.data.timeline,
        needs: result.data.needs,
      },
      select: { id: true },
    })

    await recordAudit({
      request,
      action: 'QUOTE_REQUEST_CREATED',
      entity: 'QuoteRequest',
      entityId: quote.id,
    })

    return NextResponse.json(
      {
        ok: true,
        message:
          'QTS đã nhận yêu cầu báo giá. Phạm vi và chi phí sẽ được xác nhận sau khi trao đổi.',
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return messageResponse(error.message, 400)
    }

    console.error('Không thể lưu yêu cầu báo giá.', error)
    return messageResponse(
      'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.',
      500,
    )
  }
}
