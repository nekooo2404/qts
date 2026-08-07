import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  buildAuditQuery,
  mapAuditEventRow,
  type AuditEventRow,
} from '@backend/server/identity/audit-service'

describe('identity audit query contract', () => {
  it('builds a stable, parameterized tenant-scoped query', () => {
    const query = buildAuditQuery({
      tenantId: 'tenant-1',
      page: 2,
      pageSize: 25,
      action: 'IDENTITY_PROVIDER_UPDATED',
      resourceType: 'identity_provider',
      outcome: 'SUCCESS',
    })

    expect(query.text).not.toContain('tenant-1')
    expect(query.text).toContain('tenant_id = $1')
    expect(query.text).toContain('action = $2')
    expect(query.text).toContain('resource_type = $3')
    expect(query.text).toContain('outcome = $4')
    expect(query.text).toContain('LIMIT $5 OFFSET $6')
    expect(query.values).toEqual([
      'tenant-1',
      'IDENTITY_PROVIDER_UPDATED',
      'identity_provider',
      'SUCCESS',
      25,
      25,
    ])
  })

  it('redacts actor and metadata fields that could contain secrets', () => {
    const row: AuditEventRow = {
      id: 'event-1',
      tenant_id: 'tenant-1',
      actor_user_id: 'user-1',
      action: 'IDENTITY_PROVIDER_CREATED',
      resource_type: 'identity_provider',
      resource_id: 'provider-1',
      outcome: 'SUCCESS',
      request_id: 'request-1',
      ip_hash: 'hash',
      metadata: {
        actorSubject: 'user-1',
        alias: 'google',
        secretRef: 'vault://must-not-escape',
        clientSecret: 'must-not-escape',
      },
      created_at: new Date('2026-08-07T00:00:00.000Z'),
    }

    const event = mapAuditEventRow(row)
    expect(event).toMatchObject({
      id: 'event-1',
      tenantId: 'tenant-1',
      action: 'IDENTITY_PROVIDER_CREATED',
      metadata: { alias: 'google' },
    })
    expect(event).not.toHaveProperty('ipHash')
    expect(event.metadata).not.toHaveProperty('secretRef')
    expect(event.metadata).not.toHaveProperty('clientSecret')
  })
})
