import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  consumeCachedJson: vi.fn(),
  getIdentityConfig: vi.fn(),
  createIdentitySession: vi.fn(),
  destroyIdentitySession: vi.fn(),
  exchangeAuthorizationCode: vi.fn(),
  verifyIdentityTokenValue: vi.fn(),
  createSession: vi.fn(),
  findUser: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: mocks.cookies }))
vi.mock('@backend/server/identity/cache', () => ({
  consumeCachedJson: mocks.consumeCachedJson,
  deleteCachedKeys: vi.fn(),
}))
vi.mock('@backend/server/identity/config', () => ({
  getIdentityConfig: mocks.getIdentityConfig,
}))
vi.mock('@backend/server/identity/identity-session', () => ({
  createIdentitySession: mocks.createIdentitySession,
  destroyIdentitySession: mocks.destroyIdentitySession,
}))
vi.mock('@backend/server/identity/oauth', () => ({
  exchangeAuthorizationCode: mocks.exchangeAuthorizationCode,
  matchesOauthStateCookie: vi.fn(() => true),
  oauthStateCookieName: vi.fn(() => 'qts_identity_state'),
}))
vi.mock('@backend/server/identity/keycloak', () => ({
  verifyIdentityTokenValue: mocks.verifyIdentityTokenValue,
}))
vi.mock('@/lib/auth/session', () => ({
  createSession: mocks.createSession,
}))
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: mocks.findUser,
    },
  },
}))

import { GET } from './route'

function makeRequest() {
  return new Request(
    'http://127.0.0.1:3100/api/identity/auth/callback?state=state-value&code=code-value',
  )
}

describe('identity callback portal session bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => ({ value: 'state-value' })),
      delete: vi.fn(),
      set: vi.fn(),
    })
    mocks.consumeCachedJson.mockResolvedValue({
      tenantId: null,
      codeVerifier: 'verifier',
      nonce: 'nonce',
      returnTo: '/portal/dashboard',
      createdAt: Date.now(),
    })
    mocks.getIdentityConfig.mockReturnValue({
      KEYCLOAK_CLIENT_ID: 'qts-admin-console',
      IDENTITY_CALLBACK_URL: 'http://127.0.0.1:3100/api/identity/auth/callback',
    })
    mocks.exchangeAuthorizationCode.mockResolvedValue({
      access_token: 'access-token',
      id_token: 'id-token',
      refresh_token: 'refresh-token',
      expires_in: 300,
    })
    mocks.verifyIdentityTokenValue.mockResolvedValue({
      subject: 'keycloak-user',
      email: 'ADMIN@QTS.LOCAL',
      displayName: 'QTS Administrator',
      realmRoles: ['platform-admin'],
      claims: { sub: 'keycloak-user' },
    })
    mocks.createIdentitySession.mockResolvedValue('identity-session-id')
    mocks.destroyIdentitySession.mockResolvedValue(undefined)
    mocks.findUser.mockResolvedValue({ id: 'local-user-id', active: true })
    mocks.createSession.mockResolvedValue(undefined)
  })

  it('creates the legacy Portal session for a provisioned OIDC user', async () => {
    const response = await GET(makeRequest())

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/portal/dashboard')
    expect(mocks.findUser).toHaveBeenCalledWith({
      where: { email: 'admin@qts.local' },
      select: { id: true, active: true },
    })
    expect(mocks.createSession).toHaveBeenCalledWith(
      'local-user-id',
      expect.any(Request),
    )
  })

  it('does not bridge the identity-only admin console session', async () => {
    mocks.consumeCachedJson.mockResolvedValueOnce({
      tenantId: null,
      codeVerifier: 'verifier',
      nonce: 'nonce',
      returnTo: '/admin/identity/tenants',
      createdAt: Date.now(),
    })

    const response = await GET(makeRequest())

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/admin/identity/tenants')
    expect(mocks.findUser).not.toHaveBeenCalled()
    expect(mocks.createSession).not.toHaveBeenCalled()
  })

  it('rejects an unprovisioned user and removes the temporary identity session', async () => {
    mocks.findUser.mockResolvedValueOnce(null)

    const response = await GET(makeRequest())

    expect(response.status).toBe(403)
    expect(mocks.createSession).not.toHaveBeenCalled()
    expect(mocks.destroyIdentitySession).toHaveBeenCalledWith(
      'identity-session-id',
    )
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'PORTAL_ACCOUNT_NOT_PROVISIONED' },
    })
  })
})
