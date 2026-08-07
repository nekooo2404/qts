import { describe, expect, it, vi } from 'vitest'
import type { PoolClient } from 'pg'

vi.mock('server-only', () => ({}))

import { recordTenantAudit } from '@backend/server/identity/audit-writer'

describe('identity audit writer', () => {
  it('records the audit event and matching outbox event in one transaction', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: 'audit-1' }] })
      .mockResolvedValueOnce({ rows: [] })
    const client = { query } as unknown as PoolClient

    await recordTenantAudit(client, {
      tenantId: 'tenant-1',
      actorSubject: 'user-1',
      action: 'APPLICATION_CREATED',
      resourceType: 'application',
      resourceId: 'application-1',
      requestId: 'request-1',
      metadata: { clientId: 'client-1' },
    })

    expect(query).toHaveBeenCalledTimes(2)
    expect(query.mock.calls[0]?.[0]).toContain('identity.audit_events')
    expect(query.mock.calls[0]?.[1]).toEqual([
      'tenant-1',
      'APPLICATION_CREATED',
      'application',
      'application-1',
      'SUCCESS',
      'request-1',
      JSON.stringify({ actorSubject: 'user-1', clientId: 'client-1' }),
    ])
    expect(query.mock.calls[1]?.[0]).toContain('identity.outbox_events')
    expect(query.mock.calls[1]?.[1]).toEqual([
      'tenant-1',
      'APPLICATION_CREATED',
      'application',
      'application-1',
      JSON.stringify({ auditEventId: 'audit-1' }),
    ])
  })
})
