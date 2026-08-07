import 'server-only'

import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose'

import { readBearerToken } from '@/server/identity/bearer-token'
import { getIdentityConfig } from '@/server/identity/config'
import {
  acquireIdentitySessionLock,
  readIdentitySession,
  updateIdentitySession,
} from '@/server/identity/identity-session'
import {
  assertIdentityMutationOrigin,
  IdentityHttpError,
} from '@/server/identity/http'
import { refreshKeycloakTokens } from '@/server/identity/oauth'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/domain/permissions'

export type IdentityPrincipal = {
  subject: string
  email: string | null
  displayName: string | null
  realmRoles: string[]
  claims: JWTPayload
}

function claimStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return typeof value === 'string' ? [value] : []
}

export function principalHasStrongAuthentication(principal: IdentityPrincipal) {
  const methods = claimStringList(principal.claims.amr).map((value) =>
    value.toLowerCase(),
  )
  if (
    methods.some((method) =>
      ['mfa', 'otp', 'totp', 'webauthn', 'hwk', 'fido2'].includes(method),
    )
  ) {
    return true
  }
  const assurance = claimStringList(principal.claims.acr)
    .join(' ')
    .toLowerCase()
  return /(?:^|[^a-z])(mfa|multi[-_ ]?factor|loa[-_: ]?2|high)(?:$|[^a-z])/.test(
    assurance,
  )
}

export function requireStrongAuthentication(principal: IdentityPrincipal) {
  // The legacy bridge is intentionally limited to local development and cannot
  // be used to bypass MFA in a deployed environment.
  if (
    process.env.NODE_ENV !== 'production' &&
    principal.subject.startsWith('legacy:')
  ) {
    return
  }
  if (!principalHasStrongAuthentication(principal)) {
    throw new IdentityHttpError(
      403,
      'MFA_REQUIRED',
      'Multi-factor authentication is required for this operation.',
    )
  }
}

let remoteJwks: JWTVerifyGetKey | null = null

function getRemoteJwks() {
  if (remoteJwks) return remoteJwks
  const issuer = getIdentityConfig().KEYCLOAK_ISSUER_URL.replace(/\/$/, '')
  remoteJwks = createRemoteJWKSet(
    new URL(`${issuer}/protocol/openid-connect/certs`),
    {
      cooldownDuration: 30_000,
      cacheMaxAge: 600_000,
      timeoutDuration: 3_000,
    },
  )
  return remoteJwks
}

function principalFromPayload(payload: JWTPayload): IdentityPrincipal {
  const realmAccess = payload.realm_access
  const roles =
    realmAccess &&
    typeof realmAccess === 'object' &&
    Array.isArray((realmAccess as { roles?: unknown }).roles)
      ? (realmAccess as { roles: unknown[] }).roles.filter(
          (role): role is string => typeof role === 'string',
        )
      : []

  if (!payload.sub) throw new Error('Missing subject claim.')
  return {
    subject: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    displayName:
      typeof payload.name === 'string'
        ? payload.name
        : typeof payload.preferred_username === 'string'
          ? payload.preferred_username
          : null,
    realmRoles: roles,
    claims: payload,
  }
}

async function legacyDevelopmentPrincipal() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.IDENTITY_DEV_SESSION_BRIDGE !== 'true'
  ) {
    return null
  }
  const legacyUser = await getCurrentUser()
  if (!legacyUser || !hasPermission(legacyUser, 'admin.access')) return null
  return {
    subject: `legacy:${legacyUser.id}`,
    email: legacyUser.email,
    displayName: legacyUser.name,
    realmRoles: ['platform-admin'],
    claims: { sub: `legacy:${legacyUser.id}` },
  } satisfies IdentityPrincipal
}

export async function getIdentitySessionPrincipal() {
  const refreshLeewayMs = 30_000
  try {
    const session = await readIdentitySession()
    if (!session) return null

    if (session.accessTokenExpiresAt > Date.now() + refreshLeewayMs) {
      try {
        return await verifyIdentityTokenValue(session.accessToken)
      } catch {
        // A stale or rotated access token can still be recovered below.
      }
    }

    if (!session.refreshToken) return null
    const lock = await acquireIdentitySessionLock(session.id)
    if (!lock.acquired) {
      const refreshed = await readIdentitySession(session.id)
      if (!refreshed || refreshed.accessTokenExpiresAt <= Date.now())
        return null
      try {
        return await verifyIdentityTokenValue(refreshed.accessToken)
      } catch {
        return null
      }
    }

    try {
      const current = await readIdentitySession(session.id)
      if (!current?.refreshToken) return null
      if (current.accessTokenExpiresAt > Date.now() + refreshLeewayMs) {
        return await verifyIdentityTokenValue(current.accessToken)
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
      return updated ? principal : null
    } finally {
      await lock.release()
    }
  } catch {
    return null
  }
}

export async function verifyIdentityTokenValue(
  token: string,
  options: { nonce?: string } = {},
) {
  const config = getIdentityConfig()
  const issuer = config.KEYCLOAK_ISSUER_URL.replace(/\/$/, '')
  const { payload } = await jwtVerify(token, getRemoteJwks(), {
    issuer,
    audience: config.KEYCLOAK_AUDIENCE,
    algorithms: ['RS256'],
    clockTolerance: 5,
    maxTokenAge: '10m',
  })
  if (options.nonce && payload.nonce !== options.nonce) {
    throw new Error('OIDC nonce mismatch.')
  }
  return principalFromPayload(payload)
}

export async function verifyIdentityAccessToken(
  request: Request,
): Promise<IdentityPrincipal> {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
    assertIdentityMutationOrigin(request)
  }
  const token = readBearerToken(request)
  if (!token) {
    const sessionPrincipal = await getIdentitySessionPrincipal()
    if (sessionPrincipal) return sessionPrincipal
    const legacyPrincipal = await legacyDevelopmentPrincipal()
    if (legacyPrincipal) return legacyPrincipal
    throw new IdentityHttpError(
      401,
      'UNAUTHENTICATED',
      'A valid bearer token is required.',
    )
  }
  if (token.length > 16_384) {
    throw new IdentityHttpError(
      401,
      'UNAUTHENTICATED',
      'A valid bearer token is required.',
    )
  }

  try {
    return await verifyIdentityTokenValue(token)
  } catch {
    throw new IdentityHttpError(
      401,
      'INVALID_ACCESS_TOKEN',
      'The access token is invalid or expired.',
    )
  }
}

export async function requirePlatformAdministrator(request: Request) {
  const principal = await verifyIdentityAccessToken(request)
  if (!principal.realmRoles.includes('platform-admin')) {
    throw new IdentityHttpError(
      403,
      'FORBIDDEN',
      'Platform administrator access is required.',
    )
  }
  requireStrongAuthentication(principal)
  return principal
}
