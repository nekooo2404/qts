import {
  assertIdentityMutationOrigin,
  identityErrorResponse,
  IdentityHttpError,
} from '@/server/identity/http'
import {
  acquireIdentitySessionLock,
  destroyIdentitySession,
  readIdentitySession,
  updateIdentitySession,
} from '@/server/identity/identity-session'
import {
  refreshKeycloakTokens,
  revokeKeycloakToken,
} from '@/server/identity/oauth'
import { verifyIdentityTokenValue } from '@/server/identity/keycloak'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let lock: Awaited<ReturnType<typeof acquireIdentitySessionLock>> | null = null
  try {
    assertIdentityMutationOrigin(request)
    const session = await readIdentitySession()
    if (!session || !session.refreshToken) {
      throw new IdentityHttpError(
        401,
        'SESSION_REFRESH_REQUIRED',
        'A refreshable identity session is required.',
      )
    }
    lock = await acquireIdentitySessionLock(session.id)
    if (!lock.acquired) {
      throw new IdentityHttpError(
        409,
        'SESSION_REFRESH_IN_PROGRESS',
        'Another refresh is already in progress.',
      )
    }
    const current = await readIdentitySession(session.id)
    if (!current?.refreshToken) {
      throw new IdentityHttpError(
        401,
        'SESSION_EXPIRED',
        'The identity session has expired.',
      )
    }
    const tokens = await refreshKeycloakTokens(current.refreshToken)
    const principal = await verifyIdentityTokenValue(tokens.access_token)
    const updated = await updateIdentitySession(session.id, {
      subject: principal.subject,
      email: principal.email,
      displayName: principal.displayName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? current.refreshToken,
      accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
    })
    if (!updated)
      throw new IdentityHttpError(
        401,
        'SESSION_EXPIRED',
        'The identity session has expired.',
      )
    return Response.json({
      data: {
        authenticated: true,
        accessTokenExpiresAt: updated.accessTokenExpiresAt,
      },
    })
  } catch (error) {
    if (
      error instanceof IdentityHttpError &&
      error.code === 'OAUTH_TOKEN_EXCHANGE_FAILED'
    ) {
      const session = await readIdentitySession()
      if (session) {
        if (session.refreshToken)
          await revokeKeycloakToken(session.refreshToken)
        await destroyIdentitySession(session.id)
      }
    }
    return identityErrorResponse(error)
  } finally {
    await lock?.release()
  }
}
