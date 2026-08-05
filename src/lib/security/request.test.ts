import { describe, expect, it } from 'vitest'

import { isSameOriginRequest, sanitizeNextPath } from '@/lib/security/request'

describe('request security', () => {
  it('accepts only local portal destinations after login', () => {
    expect(sanitizeNextPath('/portal/projects?tab=active')).toBe(
      '/portal/projects?tab=active',
    )
    expect(sanitizeNextPath('https://attacker.example')).toBe(
      '/portal/dashboard',
    )
    expect(sanitizeNextPath('//attacker.example/path')).toBe(
      '/portal/dashboard',
    )
    expect(sanitizeNextPath('/gioi-thieu')).toBe('/portal/dashboard')
  })

  it('accepts matching browser origins and rejects cross-site posts', () => {
    const valid = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { host: 'localhost:3000', origin: 'http://localhost:3000' },
    })
    const crossSite = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'https://attacker.example',
      },
    })

    expect(isSameOriginRequest(valid)).toBe(true)
    expect(isSameOriginRequest(crossSite)).toBe(false)
  })

  it('rejects mutation requests without an origin header', () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { host: 'localhost:3000' },
    })

    expect(isSameOriginRequest(request)).toBe(false)
  })
})
