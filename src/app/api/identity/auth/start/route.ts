import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { z } from 'zod'

import {
  consumeDistributedRateLimit,
  setCachedJson,
} from '@backend/server/identity/cache'
import { getIdentityConfig } from '@backend/server/identity/config'
import {
  IdentityHttpError,
  identityErrorResponse,
} from '@backend/server/identity/http'
import {
  authorizationEndpoint,
  createPkcePair,
  oauthStateCookieName,
  safeReturnTo,
} from '@backend/server/identity/oauth'
import { requestIp } from '@/lib/security/request'

export const runtime = 'nodejs'

const tenantIdSchema = z.string().uuid()

export async function GET(request: Request) {
  try {
    const rateLimit = await consumeDistributedRateLimit({
      key: `oauth-start:${requestIp(request)}`,
      limit: 20,
      windowMs: 60_000,
    })
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many sign-in attempts.',
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      )
    }
    const url = new URL(request.url)
    const rawTenantId = url.searchParams.get('tenantId')
    const tenantId = rawTenantId
      ? (tenantIdSchema.safeParse(rawTenantId).data ?? null)
      : null
    if (rawTenantId && !tenantId) {
      throw new IdentityHttpError(
        400,
        'INVALID_TENANT_ID',
        'tenantId must be a UUID.',
      )
    }
    const returnTo = safeReturnTo(url.searchParams.get('returnTo'))
    const { codeVerifier, codeChallenge } = createPkcePair()
    const state = randomBytes(32).toString('base64url')
    const nonce = randomBytes(24).toString('base64url')
    const stateKey = `identity:oauth:state:${createHash('sha256').update(state).digest('hex')}`
    await setCachedJson(
      stateKey,
      { tenantId, codeVerifier, nonce, returnTo, createdAt: Date.now() },
      600,
    )

    const cookieStore = await cookies()
    cookieStore.set(oauthStateCookieName(state), state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 600,
      priority: 'high',
    })

    const config = getIdentityConfig()
    const authUrl = new URL(authorizationEndpoint())
    authUrl.searchParams.set('client_id', config.KEYCLOAK_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', config.IDENTITY_CALLBACK_URL)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid profile email')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('nonce', nonce)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    return Response.redirect(authUrl)
  } catch (error) {
    return identityErrorResponse(error)
  }
}
