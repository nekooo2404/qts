import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { proxy } from '@/proxy'
import { IDENTITY_SESSION_COOKIE } from '@backend/server/identity/constants'

function request(pathname: string, cookie?: string) {
  return new NextRequest(`http://127.0.0.1:3100${pathname}`, {
    headers: cookie ? { cookie } : undefined,
  })
}

describe('portal and admin proxy session boundaries', () => {
  it('allows an Identity session into the Identity admin surface', () => {
    const response = proxy(
      request(
        '/admin/identity/tenants',
        `${IDENTITY_SESSION_COOKIE}=opaque-session-id`,
      ),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('does not let an Identity-only session enter legacy admin surfaces', () => {
    const response = proxy(
      request('/admin/users', `${IDENTITY_SESSION_COOKIE}=opaque-session-id`),
    )
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain(
      '/portal/login?next=%2Fadmin%2Fusers',
    )
  })

  it('redirects unauthenticated Identity admin requests to login', () => {
    const response = proxy(request('/admin/identity/tenants'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/portal/login')
  })
})
