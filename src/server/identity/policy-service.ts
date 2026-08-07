import 'server-only'

import type { QueryResultRow } from 'pg'

import { withTenantTransaction } from '@/server/identity/database'
import { IdentityHttpError } from '@/server/identity/http'
import { policyConditionsSchema } from '@/server/identity/schemas'
import { recordTenantAudit } from '@/server/identity/tenant-service'
import type { AbacPolicy, PolicyEffect } from '@/server/identity/types'

type PolicyRow = QueryResultRow & {
  id: string
  tenant_id: string
  name: string
  effect: PolicyEffect
  resource: string
  action: string
  conditions: unknown
  enabled: boolean
  created_at: Date
  updated_at: Date
}

function mapPolicy(row: PolicyRow): AbacPolicy {
  const parsed = policyConditionsSchema.safeParse(row.conditions)
  return {
    id: row.id,
    name: row.name,
    effect: row.effect,
    resource: row.resource,
    action: row.action,
    conditions: parsed.success ? parsed.data : [],
    enabled: row.enabled,
  }
}

export async function listPolicies(tenantId: string) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<PolicyRow>(
      `SELECT id, tenant_id, name, effect, resource, action, conditions,
              enabled, created_at, updated_at
       FROM identity.policies
       WHERE tenant_id = $1
       ORDER BY created_at ASC, id ASC`,
      [tenantId],
    )
    return result.rows.map(mapPolicy)
  })
}

export async function createPolicy(
  tenantId: string,
  input: {
    name: string
    effect: PolicyEffect
    resource: string
    action: string
    conditions: unknown
    enabled: boolean
  },
  context: { actorSubject: string; requestId?: string },
) {
  const conditions = policyConditionsSchema.parse(input.conditions)
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<PolicyRow>(
      `INSERT INTO identity.policies
         (tenant_id, name, effect, resource, action, conditions, enabled)
       VALUES ($1, $2, $3::identity.policy_effect, $4, $5, $6::jsonb, $7)
       RETURNING id, tenant_id, name, effect, resource, action, conditions,
                 enabled, created_at, updated_at`,
      [
        tenantId,
        input.name,
        input.effect,
        input.resource,
        input.action,
        JSON.stringify(conditions),
        input.enabled,
      ],
    )
    const row = result.rows[0]
    if (!row) throw new Error('Policy insert returned no row.')
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'POLICY_CREATED',
      resourceType: 'policy',
      resourceId: row.id,
      requestId: context.requestId,
      metadata: {
        effect: row.effect,
        resource: row.resource,
        action: row.action,
      },
    })
    return mapPolicy(row)
  })
}

export async function updatePolicy(
  tenantId: string,
  policyId: string,
  input: {
    name?: string
    effect?: PolicyEffect
    resource?: string
    action?: string
    conditions?: unknown
    enabled?: boolean
  },
  context: { actorSubject: string; requestId?: string },
) {
  const conditions =
    input.conditions === undefined
      ? undefined
      : policyConditionsSchema.parse(input.conditions)
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<PolicyRow>(
      `UPDATE identity.policies
       SET name = COALESCE($3, name),
           effect = COALESCE($4::identity.policy_effect, effect),
           resource = COALESCE($5, resource),
           action = COALESCE($6, action),
           conditions = COALESCE($7::jsonb, conditions),
           enabled = COALESCE($8, enabled),
           updated_at = now()
       WHERE id = $1 AND tenant_id = $2
       RETURNING id, tenant_id, name, effect, resource, action, conditions,
                 enabled, created_at, updated_at`,
      [
        policyId,
        tenantId,
        input.name ?? null,
        input.effect ?? null,
        input.resource ?? null,
        input.action ?? null,
        conditions === undefined ? null : JSON.stringify(conditions),
        input.enabled ?? null,
      ],
    )
    const row = result.rows[0]
    if (!row)
      throw new IdentityHttpError(404, 'POLICY_NOT_FOUND', 'Policy not found.')
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'POLICY_UPDATED',
      resourceType: 'policy',
      resourceId: row.id,
      requestId: context.requestId,
      metadata: { fields: Object.keys(input).sort().join(',') },
    })
    return mapPolicy(row)
  })
}

export async function disablePolicy(
  tenantId: string,
  policyId: string,
  context: { actorSubject: string; requestId?: string },
) {
  return updatePolicy(tenantId, policyId, { enabled: false }, context)
}
