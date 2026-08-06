export const DEFAULT_PORTAL_PATH = '/portal/dashboard'

export function sanitizeNextPath(value: unknown) {
  if (typeof value !== 'string' || value.startsWith('//')) {
    return DEFAULT_PORTAL_PATH
  }

  try {
    const target = new URL(value, 'http://qts.local')
    const isPortalPath =
      target.pathname === '/portal' || target.pathname.startsWith('/portal/')
    const isAdminPath =
      target.pathname === '/admin' || target.pathname.startsWith('/admin/')

    if (
      target.origin !== 'http://qts.local' ||
      (!isPortalPath && !isAdminPath)
    ) {
      return DEFAULT_PORTAL_PATH
    }

    return `${target.pathname}${target.search}`
  } catch {
    return DEFAULT_PORTAL_PATH
  }
}

function firstForwardedValue(value: string | null) {
  return value?.split(',')[0]?.trim() ?? null
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin')
  const forwardedHost = firstForwardedValue(
    request.headers.get('x-forwarded-host'),
  )
  const host = forwardedHost ?? request.headers.get('host')

  if (!origin || !host) {
    return false
  }

  try {
    const originUrl = new URL(origin)
    const allowedAppHost = process.env.APP_URL
      ? new URL(process.env.APP_URL).host
      : null

    return originUrl.host === host || originUrl.host === allowedAppHost
  } catch {
    return false
  }
}

export function requestIp(request: Request) {
  return (
    firstForwardedValue(request.headers.get('x-forwarded-for')) ??
    request.headers.get('x-real-ip') ??
    'local'
  )
}
