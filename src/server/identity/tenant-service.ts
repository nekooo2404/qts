import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { PoolClient, QueryResultRow } from 'pg'

import {
  setTenantContext,
  withPlatformTransaction,
  withTenantTransaction,
} from '@/server/identity/database'
import { IdentityHttpError } from '@/server/identity/http'
import type {
  IsolationMode,
  Tenant,
  TenantBranding,
  TenantStatus,
} from '@/server/identity/types'

type TenantRow = QueryResultRow & {
  id: string
  key: string
  name: string
  plan: string
  status: TenantStatus
  isolation_mode: IsolationMode
  branding: TenantBranding
  created_at: Date
  updated_at: Date
}

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    plan: row.plan,
    status: row.status,
    isolationMode: row.isolation_mode,
    branding: row.branding,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function recordTenantAudit(
  client: PoolClient,
  input: {
    tenantId: string
    actorSubject: string
    action: string
    resourceType?: string
    resourceId?: string
    outcome?: string
    requestId?: string
    metadata?: Record<string, unknown>
  },
) {
  const event = await client.query<{ id: string }>(
    `INSERT INTO identity.audit_events
      (tenant_id, action, resource_type, resource_id, outcome, request_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING id`,
    [
      input.tenantId,
      input.action,
      input.resourceType ?? 'tenant',
      input.resourceId ?? input.tenantId,
      input.outcome ?? 'SUCCESS',
      input.requestId ?? null,
      JSON.stringify({
        actorSubject: input.actorSubject,
        ...(input.metadata ?? {}),
      }),
    ],
  )

  await client.query(
    `INSERT INTO identity.outbox_events
      (tenant_id, event_type, aggregate_type, aggregate_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      input.tenantId,
      input.action,
      input.resourceType ?? 'tenant',
      input.resourceId ?? input.tenantId,
      JSON.stringify({ auditEventId: event.rows[0]?.id }),
    ],
  )
}

export async function createTenant(
  input: {
    key: string
    name: string
    plan: string
    status: Exclude<TenantStatus, 'DELETED'>
    branding: TenantBranding
  },
  context: { actorSubject: string; requestId?: string },
) {
  try {
    return await withPlatformTransaction(async (client) => {
      const result = await client.query<TenantRow>(
        `INSERT INTO identity.tenants (key, name, plan, status, branding)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING *`,
        [
          input.key,
          input.name,
          input.plan,
          input.status,
          JSON.stringify(input.branding),
        ],
      )
      const row = result.rows[0]
      if (!row) throw new Error('Tenant insert returned no row.')

      await setTenantContext(client, row.id)
      await client.query(
        `INSERT INTO identity.roles (tenant_id, key, name, managed)
         VALUES
           ($1, 'ADMIN', 'Admin', true),
           ($1, 'MANAGER', 'Manager', true),
           ($1, 'EMPLOYEE', 'Employee', true)
         ON CONFLICT (tenant_id, key) DO NOTHING`,
        [row.id],
      )
      await client.query(
        `INSERT INTO identity.role_permissions (role_id, permission_key)
         SELECT role.id, permission.key
         FROM identity.roles role
         CROSS JOIN identity.permissions permission
         WHERE role.tenant_id = $1 AND (
           role.key = 'ADMIN'
           OR (role.key = 'MANAGER' AND permission.key IN ('USER_CREATE', 'USER_READ', 'USER_UPDATE', 'REPORT_VIEW'))
           OR (role.key = 'EMPLOYEE' AND permission.key = 'REPORT_VIEW')
         )
         ON CONFLICT DO NOTHING`,
        [row.id],
      )
      await recordTenantAudit(client, {
        tenantId: row.id,
        actorSubject: context.actorSubject,
        action: 'TENANT_CREATED',
        requestId: context.requestId,
        metadata: { key: row.key, plan: row.plan },
      })
      return mapTenant(row)
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new IdentityHttpError(
        409,
        'TENANT_KEY_CONFLICT',
        'A tenant with this key already exists.',
      )
    }
    throw error
  }
}

export async function listTenants(input: { page: number; pageSize: number }) {
  const offset = (input.page - 1) * input.pageSize
  return withPlatformTransaction(async (client) => {
    const [tenants, count] = await Promise.all([
      client.query<TenantRow>(
        `SELECT * FROM identity.tenants
         WHERE status <> 'DELETED'
         ORDER BY created_at DESC, id DESC
         LIMIT $1 OFFSET $2`,
        [input.pageSize, offset],
      ),
      client.query<{ count: string }>(
        `SELECT count(*)::text AS count
         FROM identity.tenants
         WHERE status <> 'DELETED'`,
      ),
    ])
    const totalItems = Number(count.rows[0]?.count ?? 0)
    return {
      data: tenants.rows.map(mapTenant),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / input.pageSize),
      },
    }
  })
}

export async function getTenant(tenantId: string) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<TenantRow>(
      `SELECT * FROM identity.tenants
       WHERE id = $1 AND status <> 'DELETED'`,
      [tenantId],
    )
    const row = result.rows[0]
    if (!row) {
      throw new IdentityHttpError(404, 'TENANT_NOT_FOUND', 'Tenant not found.')
    }
    return mapTenant(row)
  })
}

export async function updateTenant(
  tenantId: string,
  input: Partial<{
    name: string
    plan: string
    status: Exclude<TenantStatus, 'DELETED'>
    branding: TenantBranding
  }>,
  context: { actorSubject: string; requestId?: string },
) {
  return withTenantTransaction(tenantId, async (client) => {
    const current = await client.query<TenantRow>(
      `SELECT * FROM identity.tenants
       WHERE id = $1 AND status <> 'DELETED'
       FOR UPDATE`,
      [tenantId],
    )
    const existing = current.rows[0]
    if (!existing) {
      throw new IdentityHttpError(404, 'TENANT_NOT_FOUND', 'Tenant not found.')
    }

    const result = await client.query<TenantRow>(
      `UPDATE identity.tenants
       SET name = $2,
           plan = $3,
           status = $4,
           branding = $5::jsonb,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        tenantId,
        input.name ?? existing.name,
        input.plan ?? existing.plan,
        input.status ?? existing.status,
        JSON.stringify(input.branding ?? existing.branding),
      ],
    )
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'TENANT_UPDATED',
      requestId: context.requestId,
      metadata: { fields: Object.keys(input).sort().join(',') },
    })
    return mapTenant(result.rows[0]!)
  })
}

export async function createTenantDomain(
  tenantId: string,
  hostname: string,
  context: { actorSubject: string; requestId?: string },
) {
  const verificationToken = randomBytes(32).toString('base64url')
  const verificationTokenHash = createHash('sha256')
    .update(verificationToken)
    .digest('hex')

  try {
    return await withTenantTransaction(tenantId, async (client) => {
      const tenant = await client.query(
        `SELECT id FROM identity.tenants
         WHERE id = $1 AND status <> 'DELETED'`,
        [tenantId],
      )
      if (!tenant.rowCount) {
        throw new IdentityHttpError(
          404,
          'TENANT_NOT_FOUND',
          'Tenant not found.',
        )
      }

      const result = await client.query<{
        id: string
        tenant_id: string
        hostname: string
        verification_status: string
        created_at: Date
      }>(
        `INSERT INTO identity.tenant_domains
          (tenant_id, hostname, verification_token_hash)
         VALUES ($1, $2, $3)
         RETURNING id, tenant_id, hostname, verification_status, created_at`,
        [tenantId, hostname, verificationTokenHash],
      )
      await recordTenantAudit(client, {
        tenantId,
        actorSubject: context.actorSubject,
        action: 'TENANT_DOMAIN_CREATED',
        requestId: context.requestId,
        metadata: { hostname },
      })
      const row = result.rows[0]!
      return {
        id: row.id,
        tenantId: row.tenant_id,
        hostname: row.hostname,
        verificationStatus: row.verification_status,
        verificationToken,
        createdAt: row.created_at,
      }
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new IdentityHttpError(
        409,
        'DOMAIN_CONFLICT',
        'This hostname is already registered.',
      )
    }
    throw error
  }
}

export async function listTenantDomains(tenantId: string) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<{
      id: string
      tenant_id: string
      hostname: string
      verification_status: string
      verified_at: Date | null
      created_at: Date
    }>(
      `SELECT id, tenant_id, hostname, verification_status, verified_at, created_at
       FROM identity.tenant_domains
       WHERE tenant_id = $1
       ORDER BY created_at ASC, id ASC`,
      [tenantId],
    )
    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      hostname: row.hostname,
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
    }))
  })
}

export async function verifyTenantDomain(
  tenantId: string,
  domainId: string,
  verificationToken: string,
  context: { actorSubject: string; requestId?: string },
) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<{
      id: string
      tenant_id: string
      hostname: string
      verification_status: string
      verification_token_hash: string
      verified_at: Date | null
      created_at: Date
    }>(
      `SELECT id, tenant_id, hostname, verification_status,
              verification_token_hash, verified_at, created_at
       FROM identity.tenant_domains
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [domainId, tenantId],
    )
    const domain = result.rows[0]
    if (!domain) {
      throw new IdentityHttpError(
        404,
        'DOMAIN_NOT_FOUND',
        'Custom domain not found.',
      )
    }
    if (domain.verification_status === 'VERIFIED') {
      return {
        id: domain.id,
        tenantId: domain.tenant_id,
        hostname: domain.hostname,
        verificationStatus: domain.verification_status,
        verifiedAt: domain.verified_at,
        createdAt: domain.created_at,
      }
    }

    const expected = Buffer.from(domain.verification_token_hash, 'hex')
    const actual = createHash('sha256').update(verificationToken).digest()
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      await recordTenantAudit(client, {
        tenantId,
        actorSubject: context.actorSubject,
        action: 'TENANT_DOMAIN_VERIFICATION_FAILED',
        resourceType: 'tenant_domain',
        resourceId: domain.id,
        outcome: 'FAILURE',
        requestId: context.requestId,
        metadata: { hostname: domain.hostname },
      })
      throw new IdentityHttpError(
        422,
        'DOMAIN_VERIFICATION_FAILED',
        'The custom domain verification token is invalid.',
      )
    }

    const verified = await client.query<{
      id: string
      tenant_id: string
      hostname: string
      verification_status: string
      verified_at: Date | null
      created_at: Date
    }>(
      `UPDATE identity.tenant_domains
       SET verification_status = 'VERIFIED', verified_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING id, tenant_id, hostname, verification_status, verified_at, created_at`,
      [domain.id, tenantId],
    )
    const row = verified.rows[0]
    if (!row) throw new Error('Domain verification update returned no row.')
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'TENANT_DOMAIN_VERIFIED',
      resourceType: 'tenant_domain',
      resourceId: row.id,
      requestId: context.requestId,
      metadata: { hostname: row.hostname },
    })
    return {
      id: row.id,
      tenantId: row.tenant_id,
      hostname: row.hostname,
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
    }
  })
}
