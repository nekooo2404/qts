import { NextResponse, type NextRequest } from 'next/server'

import { getSessionCookieName } from '@/lib/auth/constants'
import { IDENTITY_SESSION_COOKIE } from '@backend/server/identity/constants'

const publicPortalRoutes = ['/portal/login', '/portal/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/portal/admin' || pathname.startsWith('/portal/admin/')) {
    const suffix = pathname.slice('/portal/admin'.length)
    const adminUrl = new URL(`/admin${suffix}`, request.url)
    adminUrl.search = search
    return NextResponse.redirect(adminUrl, 308)
  }

  if (publicPortalRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  const hasLegacySession = request.cookies.has(getSessionCookieName())
  const hasIdentitySession =
    pathname === '/admin/identity' || pathname.startsWith('/admin/identity/')
      ? request.cookies.has(IDENTITY_SESSION_COOKIE)
      : false
  const hasSession = hasLegacySession || hasIdentitySession
  if (!hasSession) {
    const loginUrl = new URL('/portal/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-qts-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
}
