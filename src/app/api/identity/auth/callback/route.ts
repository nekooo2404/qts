import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'

import { consumeCachedJson } from '@backend/server/identity/cache'
import { getIdentityConfig } from '@backend/server/identity/config'
import {
  identityErrorResponse,
  IdentityHttpError,
} from '@backend/server/identity/http'
import {
  createIdentitySession,
  destroyIdentitySession,
} from '@backend/server/identity/identity-session'
import {
  exchangeAuthorizationCode,
  matchesOauthStateCookie,
  oauthStateCookieName,
} from '@backend/server/identity/oauth'
import { verifyIdentityTokenValue } from '@backend/server/identity/keycloak'
import { createSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { sanitizeNextPath } from '@/lib/security/request'

export const runtime = 'nodejs'

type StoredOauthState = {
  tenantId: string | null
  codeVerifier: string
  nonce: string
  returnTo: string
  createdAt: number
}

function requiresLegacySession(returnTo: string) {
  if (returnTo === '/portal' || returnTo.startsWith('/portal/')) return true
  if (returnTo !== '/admin' && !returnTo.startsWith('/admin/')) return false
  return (
    returnTo !== '/admin/identity' && !returnTo.startsWith('/admin/identity/')
  )
}

async function bridgePortalSession(
  request: Request,
  returnTo: string,
  email: string | null,
) {
  if (!requiresLegacySession(returnTo)) return

  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new IdentityHttpError(
      403,
      'PORTAL_ACCOUNT_NOT_PROVISIONED',
      'Your identity is not provisioned in the QTS Portal.',
    )
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, active: true },
  })
  if (!user?.active) {
    throw new IdentityHttpError(
      403,
      'PORTAL_ACCOUNT_NOT_PROVISIONED',
      'Your identity is not provisioned in the QTS Portal.',
    )
  }

  await createSession(user.id, request)
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
    const returnTo = sanitizeNextPath(stored.returnTo)
    // Replace any previous browser session so an account switch cannot leave
    // an older refreshable session alive on the same client.
    await destroyIdentitySession()
    const identitySessionId = await createIdentitySession({
      subject: principal.subject,
      email: principal.email,
      displayName: principal.displayName,
      tenantId: stored.tenantId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
    })
    try {
      await bridgePortalSession(request, returnTo, principal.email)
    } catch (error) {
      await destroyIdentitySession(identitySessionId)
      throw error
    }
    // Keep the browser's callback origin. Next may normalize an absolute URL
    // to localhost during development while the cookie belongs to 127.0.0.1.
    return new Response(null, {
      status: 302,
      headers: { Location: returnTo },
    })
  } catch (error) {
    return identityErrorResponse(error)
  } finally {
    if (stateCookieName) cookieStore.delete(stateCookieName)
  }
}
