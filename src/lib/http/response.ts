import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

const MAX_JSON_BYTES = 32 * 1024

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? '0')

  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BYTES) {
    throw new RequestBodyError('Nội dung gửi lên vượt quá giới hạn cho phép.')
  }

  try {
    return await request.json()
  } catch {
    throw new RequestBodyError('Dữ liệu gửi lên không hợp lệ.')
  }
}

export class RequestBodyError extends Error {}

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      ok: false,
      message: 'Vui lòng kiểm tra lại thông tin.',
      errors: error.flatten().fieldErrors,
    },
    { status: 422 },
  )
}

export function messageResponse(
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json({ ok: false, message }, { status, headers })
}
