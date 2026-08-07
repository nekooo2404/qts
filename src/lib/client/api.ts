export type ApiResult<T = unknown> = {
  ok: boolean
  message: string
  data?: T
  errors?: Record<string, string[] | undefined>
}

const INVALID_RESPONSE = {
  ok: false,
  message: 'Phản hồi từ máy chủ không hợp lệ.',
} satisfies ApiResult

const NETWORK_ERROR = {
  ok: false,
  message: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
} satisfies ApiResult

function isApiResult<T>(value: unknown): value is ApiResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof value.ok === 'boolean' &&
    'message' in value &&
    typeof value.message === 'string'
  )
}

export async function apiMutation<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    return NETWORK_ERROR
  }

  const requestSucceeded = response.ok
  const payload: unknown = await response.json().catch(() => null)

  if (!isApiResult<T>(payload)) {
    return INVALID_RESPONSE
  }

  return {
    ...payload,
    ok: requestSucceeded && payload.ok,
  }
}
