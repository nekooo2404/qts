import 'server-only'

import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { QueryResultRow } from 'pg'

import { withTenantTransaction } from '@backend/server/identity/database'
import { IdentityHttpError } from '@backend/server/identity/http'
import { recordTenantAudit } from '@backend/server/identity/tenant-service'
import { sha256 } from '@/lib/security/hash'

type ApplicationStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED'
type ApplicationType = 'PUBLIC' | 'CONFIDENTIAL'

export type ApplicationInput = {
  name: string
  type: ApplicationType
  redirectUris: string[]
  allowedOrigins: string[]
  scopes: string[]
}

type ApplicationRow = QueryResultRow & {
  id: string
  tenant_id: string
  client_id: string
  client_secret_hash: string | null
  name: string
  type: ApplicationType
  redirect_uris: string[]
  allowed_origins: string[]
  scopes: string[]
  status: ApplicationStatus
  created_at: Date
  updated_at: Date
  total_count?: string | number
}

function mapApplication(row: ApplicationRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    name: row.name,
    type: row.type,
    redirectUris: row.redirect_uris,
    allowedOrigins: row.allowed_origins,
    scopes: row.scopes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function createClientId() {
  return `qts_${randomBytes(18).toString('base64url')}`
}

function createClientSecret() {
  return `qts_secret_${randomBytes(32).toString('base64url')}`
}

function hashSecret(secret: string) {
  return sha256(secret)
}

function validateRedirects(redirectUris: readonly string[]) {
  const seen = new Set<string>()
  for (const redirectUri of redirectUris) {
    let parsed: URL
    try {
      parsed = new URL(redirectUri)
    } catch {
      throw new IdentityHttpError(
        422,
        'INVALID_REDIRECT_URI',
        'Redirect URIs must be valid absolute URLs.',
      )
    }
    if (seen.has(redirectUri)) {
      throw new IdentityHttpError(
        422,
        'INVALID_REDIRECT_URI',
        'Redirect URIs must be unique.',
      )
    }
    seen.add(redirectUri)
    const isLocalHttp =
      parsed.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    if (
      (parsed.protocol !== 'https:' && !isLocalHttp) ||
      parsed.username ||
      parsed.password ||
      parsed.hash ||
      redirectUri.includes('*')
    ) {
      throw new IdentityHttpError(
        422,
        'INVALID_REDIRECT_URI',
        'Redirect URIs must be exact, use HTTPS (except localhost development URLs), and cannot contain credentials, fragments, or wildcards.',
      )
    }
  }
}

function normalizeOrigins(origins: readonly string[]) {
  const normalized = origins.map((origin) => {
    let parsed: URL
    try {
      parsed = new URL(origin)
    } catch {
      throw new IdentityHttpError(
        422,
        'INVALID_ALLOWED_ORIGIN',
        'Allowed origins must be valid absolute URLs.',
      )
    }
    const isLocalHttp =
      parsed.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(parsed.hostname)
    if (
      (parsed.protocol !== 'https:' && !isLocalHttp) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash ||
      origin.includes('*')
    ) {
      throw new IdentityHttpError(
        422,
        'INVALID_ALLOWED_ORIGIN',
        'Allowed origins must be secure origins without paths, credentials, or wildcards.',
      )
    }
    return `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase()}${parsed.port ? `:${parsed.port}` : ''}`
  })
  return [...new Set(normalized)]
}

function normalizeScopes(scopes: readonly string[]) {
  const normalized = new Set<string>()
  for (const scope of scopes) {
    const value = scope.trim()
    if (value) normalized.add(value)
  }
  return [...normalized]
}

export function normalizeApplicationInput(
  input: ApplicationInput,
): ApplicationInput {
  const normalized: ApplicationInput = {
    name: input.name.trim(),
    type: input.type,
    redirectUris: input.redirectUris.map((uri) => uri.trim()),
    allowedOrigins: normalizeOrigins(
      input.allowedOrigins.map((origin) => origin.trim()),
    ),
    scopes: normalizeScopes(input.scopes),
  }
  validateRedirects(normalized.redirectUris)
  if (!normalized.scopes.length) {
    throw new IdentityHttpError(
      422,
      'INVALID_SCOPES',
      'At least one OAuth scope is required.',
    )
  }
  return normalized
}

async function assertTenantExists(
  client: {
    query: (
      text: string,
      values?: unknown[],
    ) => Promise<{ rowCount: number | null }>
  },
  tenantId: string,
) {
  const result = await client.query(
    `SELECT id FROM identity.tenants WHERE id = $1 AND status <> 'DELETED'`,
    [tenantId],
  )
  if (!result.rowCount) {
    throw new IdentityHttpError(404, 'TENANT_NOT_FOUND', 'Tenant not found.')
  }
}

export async function listApplications(
  tenantId: string,
  input: { page?: number; pageSize?: number } = {},
) {
  return withTenantTransaction(tenantId, async (client) => {
    await assertTenantExists(client, tenantId)
    const page = Math.max(1, Math.floor(input.page ?? 1) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, Math.floor(input.pageSize ?? 20) || 20),
    )
    const result = await client.query<ApplicationRow>(
      `SELECT id, tenant_id, client_id, client_secret_hash, name, type,
              redirect_uris, allowed_origins, scopes, status, created_at, updated_at,
              count(*) OVER() AS total_count
       FROM identity.applications
       WHERE tenant_id = $1 AND status <> 'REVOKED'
       ORDER BY created_at DESC, id DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, pageSize, (page - 1) * pageSize],
    )
    const totalItems = Number(result.rows[0]?.total_count ?? 0)
    return {
      data: result.rows.map(mapApplication),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    }
  })
}

export async function createApplication(
  tenantId: string,
  input: ApplicationInput,
  context: { actorSubject: string; requestId?: string },
) {
  const normalized = normalizeApplicationInput(input)
  const clientId = createClientId()
  const clientSecret =
    input.type === 'CONFIDENTIAL' ? createClientSecret() : null
  return withTenantTransaction(tenantId, async (client) => {
    try {
      await assertTenantExists(client, tenantId)
      const result = await client.query<ApplicationRow>(
        `INSERT INTO identity.applications
           (tenant_id, client_id, client_secret_hash, name, type,
            redirect_uris, allowed_origins, scopes)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
         RETURNING id, tenant_id, client_id, client_secret_hash, name, type,
                   redirect_uris, allowed_origins, scopes, status, created_at, updated_at`,
        [
          tenantId,
          clientId,
          clientSecret ? hashSecret(clientSecret) : null,
          normalized.name,
          normalized.type,
          JSON.stringify(normalized.redirectUris),
          JSON.stringify(normalized.allowedOrigins),
          JSON.stringify(normalized.scopes),
        ],
      )
      const row = result.rows[0]
      if (!row) throw new Error('Application insert returned no row.')
      await recordTenantAudit(client, {
        tenantId,
        actorSubject: context.actorSubject,
        action: 'APPLICATION_CREATED',
        resourceType: 'application',
        resourceId: row.id,
        requestId: context.requestId,
        metadata: { clientId: row.client_id, type: row.type },
      })
      return {
        ...mapApplication(row),
        ...(clientSecret ? { clientSecret } : {}),
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new IdentityHttpError(
          409,
          'APPLICATION_CONFLICT',
          'The application client id already exists.',
        )
      }
      throw error
    }
  })
}

export async function updateApplication(
  tenantId: string,
  applicationId: string,
  input: {
    name?: string
    redirectUris?: string[]
    allowedOrigins?: string[]
    scopes?: string[]
    status?: ApplicationStatus
  },
  context: { actorSubject: string; requestId?: string },
) {
  const redirectUris = input.redirectUris?.map((uri) => uri.trim())
  if (redirectUris) validateRedirects(redirectUris)
  const allowedOrigins = input.allowedOrigins
    ? normalizeOrigins(input.allowedOrigins.map((origin) => origin.trim()))
    : undefined
  const scopes = input.scopes ? normalizeScopes(input.scopes) : undefined
  if (input.scopes && !scopes?.length) {
    throw new IdentityHttpError(
      422,
      'INVALID_SCOPES',
      'At least one OAuth scope is required.',
    )
  }
  return withTenantTransaction(tenantId, async (client) => {
    await assertTenantExists(client, tenantId)
    const current = await client.query<ApplicationRow>(
      `SELECT id, tenant_id, client_id, client_secret_hash, name, type,
              redirect_uris, allowed_origins, scopes, status, created_at, updated_at
       FROM identity.applications WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [applicationId, tenantId],
    )
    const existing = current.rows[0]
    if (!existing)
      throw new IdentityHttpError(
        404,
        'APPLICATION_NOT_FOUND',
        'Application not found.',
      )
    const result = await client.query<ApplicationRow>(
      `UPDATE identity.applications
       SET name = COALESCE($3, name),
           redirect_uris = COALESCE($4::jsonb, redirect_uris),
           allowed_origins = COALESCE($5::jsonb, allowed_origins),
           scopes = COALESCE($6::jsonb, scopes),
           status = COALESCE($7::identity.application_status, status),
           updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING id, tenant_id, client_id, client_secret_hash, name, type,
                 redirect_uris, allowed_origins, scopes, status, created_at, updated_at`,
      [
        applicationId,
        tenantId,
        input.name?.trim() ?? null,
        redirectUris ? JSON.stringify(redirectUris) : null,
        allowedOrigins ? JSON.stringify(allowedOrigins) : null,
        scopes ? JSON.stringify(scopes) : null,
        input.status ?? null,
      ],
    )
    const row = result.rows[0]!
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'APPLICATION_UPDATED',
      resourceType: 'application',
      resourceId: row.id,
      requestId: context.requestId,
      metadata: { fields: Object.keys(input).sort().join(',') },
    })
    return mapApplication(row)
  })
}

export async function rotateApplicationSecret(
  tenantId: string,
  applicationId: string,
  context: { actorSubject: string; requestId?: string },
) {
  const clientSecret = createClientSecret()
  return withTenantTransaction(tenantId, async (client) => {
    await assertTenantExists(client, tenantId)
    const result = await client.query<ApplicationRow>(
      `UPDATE identity.applications
       SET client_secret_hash = $3, updated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND type = 'CONFIDENTIAL' AND status <> 'REVOKED'
       RETURNING id, tenant_id, client_id, client_secret_hash, name, type,
                 redirect_uris, allowed_origins, scopes, status, created_at, updated_at`,
      [applicationId, tenantId, hashSecret(clientSecret)],
    )
    const row = result.rows[0]
    if (!row) {
      throw new IdentityHttpError(
        404,
        'CONFIDENTIAL_APPLICATION_NOT_FOUND',
        'A non-revoked confidential application was not found.',
      )
    }
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'APPLICATION_SECRET_ROTATED',
      resourceType: 'application',
      resourceId: row.id,
      requestId: context.requestId,
      metadata: { clientId: row.client_id },
    })
    return { application: mapApplication(row), clientSecret }
  })
}

export function verifyApplicationSecret(secret: string, storedHash: string) {
  const expected = Buffer.from(storedHash)
  const actual = Buffer.from(hashSecret(secret))
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
