import { z, type ZodType } from 'zod'

import { isSameOriginRequest } from '@/lib/security/request'

export class IdentityHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'IdentityHttpError'
  }
}

export function parseIdentityUuid(value: string, name = 'id') {
  const result = z.string().uuid().safeParse(value)
  if (!result.success) {
    throw new IdentityHttpError(400, 'INVALID_ID', `Invalid ${name}.`)
  }
  return result.data
}

export function assertIdentityMutationOrigin(request: Request) {
  if (request.headers.get('origin') && !isSameOriginRequest(request)) {
    throw new IdentityHttpError(
      403,
      'ORIGIN_NOT_ALLOWED',
      'The request origin is not allowed.',
    )
  }
}

export async function readIdentityJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new IdentityHttpError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Content-Type must be application/json.',
    )
  }
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > 256 * 1024) {
    throw new IdentityHttpError(
      413,
      'REQUEST_BODY_TOO_LARGE',
      'Request body exceeds the 256 KB limit.',
    )
  }

  let value: unknown
  try {
    value = await request.json()
  } catch {
    throw new IdentityHttpError(400, 'INVALID_JSON', 'Request body is invalid.')
  }

  const result = schema.safeParse(value)
  if (!result.success) {
    throw new IdentityHttpError(
      422,
      'VALIDATION_ERROR',
      'Request validation failed.',
      z.flattenError(result.error),
    )
  }
  return result.data
}

export function parseIdentityQuery<T>(request: Request, schema: ZodType<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const result = schema.safeParse(params)
  if (!result.success) {
    throw new IdentityHttpError(
      422,
      'VALIDATION_ERROR',
      'Query validation failed.',
      z.flattenError(result.error),
    )
  }
  return result.data
}

export function identityErrorResponse(error: unknown) {
  if (error instanceof IdentityHttpError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      },
      { status: error.status },
    )
  }

  console.error('Unhandled identity platform error.', error)
  return Response.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The identity service could not complete the request.',
      },
    },
    { status: 500 },
  )
}
