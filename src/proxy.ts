import { NextResponse, type NextRequest } from 'next/server'

import { getSessionCookieName } from '@/lib/auth/constants'

const publicPortalRoutes = ['/portal/login', '/portal/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (publicPortalRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.has(getSessionCookieName())
  if (!hasSession) {
    const loginUrl = new URL('/portal/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*'],
}
