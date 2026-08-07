import 'server-only'

import type { PoolClient, QueryResultRow } from 'pg'

import {
  withPlatformAdminTransaction,
  withTenantTransaction,
} from '@backend/server/identity/database'

const SENSITIVE_METADATA_KEY =
  /secret|token|password|credential|private|authorization|cookie|assertion|signature/i

export type AuditEventRow = QueryResultRow & {
  id: string
  tenant_id: string | null
  tenant_key?: string | null
  tenant_name?: string | null
  actor_user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  outcome: string
  request_id: string | null
  ip_hash: string | null
  metadata: unknown
  created_at: Date
}

export type AuditEvent = {
  id: string
  tenantId: string | null
  tenantKey: string | null
  tenantName: string | null
  actorUserId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  outcome: string
  requestId: string | null
  metadata: Record<string, unknown>
  createdAt: Date
}

export type AuditQueryInput = {
  tenantId?: string
  platformAdmin?: boolean
  page: number
  pageSize: number
  action?: string
  resourceType?: string
  outcome?: string
  actorSubject?: string
}

export type AuditQuery = {
  text: string
  values: unknown[]
  countText: string
  countValues: unknown[]
}

function sanitizeMetadataValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]'
  if (value === null) return null
  if (typeof value === 'string') return value.slice(0, 2048)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeMetadataValue(item, depth + 1))
  }
  if (typeof value !== 'object') return undefined

  const output: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_METADATA_KEY.test(key)) continue
    const sanitized = sanitizeMetadataValue(child, depth + 1)
    if (sanitized !== undefined) output[key.slice(0, 120)] = sanitized
  }
  return output
}

function sanitizeMetadata(value: unknown): Record<string, unknown> {
  const sanitized = sanitizeMetadataValue(value)
  return sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)
    ? (sanitized as Record<string, unknown>)
    : {}
}

export function mapAuditEventRow(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantKey: row.tenant_key ?? null,
    tenantName: row.tenant_name ?? null,
    actorUserId: row.actor_user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    outcome: row.outcome,
    requestId: row.request_id,
    metadata: sanitizeMetadata(row.metadata),
    createdAt: row.created_at,
  }
}

function pushFilter(
  clauses: string[],
  values: unknown[],
  expression: string,
  value: unknown,
) {
  values.push(value)
  clauses.push(`${expression} = $${values.length}`)
}

export function buildAuditQuery(input: AuditQueryInput): AuditQuery {
  if (!input.tenantId && !input.platformAdmin) {
    throw new Error('A tenant scope or platform-admin scope is required.')
  }

  const page = Math.max(1, Math.floor(input.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Math.floor(input.pageSize) || 20))
  const filters: string[] = []
  const values: unknown[] = []

  if (input.tenantId) {
    pushFilter(filters, values, 'event.tenant_id', input.tenantId)
  }
  if (input.action) pushFilter(filters, values, 'event.action', input.action)
  if (input.resourceType) {
    pushFilter(filters, values, 'event.resource_type', input.resourceType)
  }
  if (input.outcome) pushFilter(filters, values, 'event.outcome', input.outcome)
  if (input.actorSubject) {
    values.push(input.actorSubject)
    filters.push(`event.metadata->>'actorSubject' = $${values.length}`)
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  const countValues = [...values]
  const countText = `
    SELECT count(*)::text AS count
    FROM identity.audit_events event
    ${where}`
  const limitPlaceholder = values.length + 1
  const offsetPlaceholder = values.length + 2
  values.push(pageSize, offset)

  const text = `
    SELECT
      event.id,
      event.tenant_id,
      tenant.key AS tenant_key,
      tenant.name AS tenant_name,
      event.actor_user_id,
      event.action,
      event.resource_type,
      event.resource_id,
      event.outcome,
      event.request_id,
      event.ip_hash,
      event.metadata,
      event.created_at
    FROM identity.audit_events event
    LEFT JOIN identity.tenants tenant ON tenant.id = event.tenant_id
    ${where}
    ORDER BY event.created_at DESC, event.id DESC
    LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`

  return { text, values, countText, countValues }
}

async function queryAuditEvents(client: PoolClient, input: AuditQueryInput) {
  const query = buildAuditQuery(input)
  const [events, count] = await Promise.all([
    client.query<AuditEventRow>(query.text, query.values),
    client.query<{ count: string }>(query.countText, query.countValues),
  ])
  const totalItems = Number(count.rows[0]?.count ?? 0)
  const page = Math.max(1, Math.floor(input.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Math.floor(input.pageSize) || 20))
  return {
    data: events.rows.map(mapAuditEventRow),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  }
}

export async function listAuditEvents(input: AuditQueryInput) {
  if (input.tenantId) {
    return withTenantTransaction(input.tenantId, (client) =>
      queryAuditEvents(client, input),
    )
  }
  if (!input.platformAdmin) {
    throw new Error('A tenant scope or platform-admin scope is required.')
  }
  return withPlatformAdminTransaction((client) =>
    queryAuditEvents(client, input),
  )
}
