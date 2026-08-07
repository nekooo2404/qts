import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import { getIdentityConfig } from '@backend/server/identity/config'
import { IdentityHttpError } from '@backend/server/identity/http'

export type KeycloakTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  refresh_expires_in?: number
  id_token?: string
  scope?: string
  session_state?: string
}

export type OauthState = {
  tenantId: string | null
  codeVerifier: string
  nonce: string
  returnTo: string
  createdAt: number
}

export const OAUTH_STATE_COOKIE_PREFIX = 'qts_identity_oauth_state_'

/**
 * Bind a Redis-backed OAuth state to the browser that initiated the flow.
 * Deriving the cookie name from the state keeps concurrent login tabs isolated.
 */
export function oauthStateCookieName(state: string) {
  return `${OAUTH_STATE_COOKIE_PREFIX}${createHash('sha256').update(state).digest('hex')}`
}

export function matchesOauthStateCookie(
  state: string,
  cookieValue: string | undefined,
) {
  if (!cookieValue) return false
  const expected = Buffer.from(state)
  const actual = Buffer.from(cookieValue)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function createPkcePair() {
  const codeVerifier = randomBytes(48).toString('base64url')
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}

export function createOauthState(): Omit<
  OauthState,
  'tenantId' | 'returnTo' | 'createdAt'
> {
  return {
    codeVerifier: createPkcePair().codeVerifier,
    nonce: randomBytes(24).toString('base64url'),
  }
}

function tokenEndpoint() {
  const issuer = getIdentityConfig().KEYCLOAK_ISSUER_URL.replace(/\/$/, '')
  return `${issuer}/protocol/openid-connect/token`
}

export function authorizationEndpoint() {
  const issuer = getIdentityConfig().KEYCLOAK_ISSUER_URL.replace(/\/$/, '')
  return `${issuer}/protocol/openid-connect/auth`
}

async function requestToken(values: URLSearchParams) {
  const config = getIdentityConfig()
  if (config.KEYCLOAK_CLIENT_SECRET)
    values.set('client_secret', config.KEYCLOAK_CLIENT_SECRET)
  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: values,
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) {
    throw new IdentityHttpError(
      401,
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      'Keycloak rejected the authorization exchange.',
    )
  }
  const payload = (await response.json()) as Partial<KeycloakTokenResponse>
  if (!payload.access_token || typeof payload.expires_in !== 'number') {
    throw new IdentityHttpError(
      502,
      'OAUTH_TOKEN_RESPONSE_INVALID',
      'Keycloak returned an invalid token response.',
    )
  }
  return payload as KeycloakTokenResponse
}

export async function exchangeAuthorizationCode(input: {
  code: string
  codeVerifier: string
  redirectUri: string
}) {
  const config = getIdentityConfig()
  return requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.KEYCLOAK_CLIENT_ID,
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: input.redirectUri,
    }),
  )
}

export async function refreshKeycloakTokens(refreshToken: string) {
  const config = getIdentityConfig()
  return requestToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.KEYCLOAK_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  )
}

export async function revokeKeycloakToken(token: string) {
  const config = getIdentityConfig()
  const endpoint = `${getIdentityConfig().KEYCLOAK_ISSUER_URL.replace(/\/$/, '')}/protocol/openid-connect/revoke`
  const values = new URLSearchParams({
    client_id: config.KEYCLOAK_CLIENT_ID,
    token,
    token_type_hint: 'refresh_token',
  })
  if (config.KEYCLOAK_CLIENT_SECRET)
    values.set('client_secret', config.KEYCLOAK_CLIENT_SECRET)
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: values,
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // Session deletion remains authoritative if the provider is unavailable.
  }
}

export function safeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return '/portal/dashboard'
  try {
    const url = new URL(value, 'http://qts.local')
    if (url.origin !== 'http://qts.local') return '/portal/dashboard'
    const allowedPath =
      url.pathname === '/portal' ||
      url.pathname.startsWith('/portal/') ||
      url.pathname === '/admin' ||
      url.pathname.startsWith('/admin/')
    if (!allowedPath) {
      return '/portal/dashboard'
    }
    return `${url.pathname}${url.search}`
  } catch {
    return '/portal/dashboard'
  }
}
