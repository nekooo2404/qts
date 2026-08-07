export function readBearerToken(request: Request) {
  const value = request.headers.get('authorization')
  if (!value) return null
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(value)
  return match?.[1] ?? null
}
