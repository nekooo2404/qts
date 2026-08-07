import 'server-only'

import type { PoolClient } from 'pg'

export type TenantAuditInput = {
  tenantId: string
  actorSubject: string
  action: string
  resourceType?: string
  resourceId?: string
  outcome?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

export async function recordTenantAudit(
  client: PoolClient,
  input: TenantAuditInput,
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
