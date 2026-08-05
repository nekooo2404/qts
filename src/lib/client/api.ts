export type ApiResult<T = unknown> = {
  ok: boolean
  message: string
  data?: T
  errors?: Record<string, string[] | undefined>
}

export async function apiMutation<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResult<T> | null

  if (!payload) {
    return { ok: false, message: 'Phản hồi từ máy chủ không hợp lệ.' }
  }

  return payload
}
