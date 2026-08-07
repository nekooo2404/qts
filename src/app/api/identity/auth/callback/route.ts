import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'

import { consumeCachedJson } from '@/server/identity/cache'
import { getIdentityConfig } from '@/server/identity/config'
import {
  identityErrorResponse,
  IdentityHttpError,
} from '@/server/identity/http'
import {
  createIdentitySession,
  destroyIdentitySession,
} from '@/server/identity/identity-session'
import {
  exchangeAuthorizationCode,
  matchesOauthStateCookie,
  oauthStateCookieName,
  safeReturnTo,
} from '@/server/identity/oauth'
import { verifyIdentityTokenValue } from '@/server/identity/keycloak'

export const runtime = 'nodejs'

type StoredOauthState = {
  tenantId: string | null
  codeVerifier: string
  nonce: string
  returnTo: string
  createdAt: number
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  let stateCookieName: string | null = null
  try {
    const url = new URL(request.url)
    const errorCode = url.searchParams.get('error')
    const state = url.searchParams.get('state')
    if (!state || state.length > 512) {
      throw new IdentityHttpError(
        400,
        'OAUTH_STATE_INVALID',
        'The sign-in state is invalid.',
      )
    }
    stateCookieName = oauthStateCookieName(state)
    if (
      !matchesOauthStateCookie(state, cookieStore.get(stateCookieName)?.value)
    ) {
      throw new IdentityHttpError(
        400,
        'OAUTH_STATE_COOKIE_MISSING',
        'The sign-in attempt is not bound to this browser.',
      )
    }
    const stateKey = `identity:oauth:state:${createHash('sha256').update(state).digest('hex')}`
    const stored = await consumeCachedJson<StoredOauthState>(stateKey)
    if (!stored || Date.now() - stored.createdAt > 10 * 60 * 1000) {
      throw new IdentityHttpError(
        400,
        'OAUTH_STATE_EXPIRED',
        'The sign-in attempt has expired.',
      )
    }
    if (errorCode) {
      throw new IdentityHttpError(
        401,
        'OAUTH_PROVIDER_ERROR',
        'The identity provider did not complete sign-in.',
      )
    }
    const code = url.searchParams.get('code')
    if (!code || code.length > 4096) {
      throw new IdentityHttpError(
        400,
        'OAUTH_CODE_MISSING',
        'The authorization code is missing.',
      )
    }
    const config = getIdentityConfig()
    const tokens = await exchangeAuthorizationCode({
      code,
      codeVerifier: stored.codeVerifier,
      redirectUri: config.IDENTITY_CALLBACK_URL,
    })
    const principal = tokens.id_token
      ? await verifyIdentityTokenValue(tokens.id_token, { nonce: stored.nonce })
      : await verifyIdentityTokenValue(tokens.access_token)
    // Replace any previous browser session so an account switch cannot leave
    // an older refreshable session alive on the same client.
    await destroyIdentitySession()
    await createIdentitySession({
      subject: principal.subject,
      email: principal.email,
      displayName: principal.displayName,
      tenantId: stored.tenantId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
    })
    return Response.redirect(
      new URL(safeReturnTo(stored.returnTo), request.url),
    )
  } catch (error) {
    return identityErrorResponse(error)
  } finally {
    if (stateCookieName) cookieStore.delete(stateCookieName)
  }
}
