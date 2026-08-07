import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createHash } from 'node:crypto'

import {
  createPkcePair,
  matchesOauthStateCookie,
  oauthStateCookieName,
  safeReturnTo,
} from '@/server/identity/oauth'

describe('identity OAuth contract', () => {
  it('creates an RFC 7636 S256 verifier/challenge pair', () => {
    const pair = createPkcePair()
    expect(pair.codeVerifier.length).toBeGreaterThanOrEqual(43)
    expect(pair.codeChallenge).toBe(
      createHash('sha256').update(pair.codeVerifier).digest('base64url'),
    )
  })

  it('allows only local portal/admin return paths', () => {
    expect(safeReturnTo('/admin/identity/tenants?tab=a')).toBe(
      '/admin/identity/tenants?tab=a',
    )
    expect(safeReturnTo('https://evil.example')).toBe('/portal/dashboard')
    expect(safeReturnTo('/portalist')).toBe('/portal/dashboard')
  })

  it('binds OAuth state to a browser cookie without sharing cookie names', () => {
    const first = 'first-state-value'
    const second = 'second-state-value'
    expect(oauthStateCookieName(first)).not.toBe(oauthStateCookieName(second))
    expect(matchesOauthStateCookie(first, first)).toBe(true)
    expect(matchesOauthStateCookie(first, second)).toBe(false)
    expect(matchesOauthStateCookie(first, undefined)).toBe(false)
  })
})
