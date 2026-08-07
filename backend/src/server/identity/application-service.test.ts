import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  audit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@backend/server/identity/database', () => ({
  withTenantTransaction: async (
    _tenantId: string,
    operation: (client: { query: typeof mocks.query }) => Promise<unknown>,
  ) => operation({ query: mocks.query }),
}))

vi.mock('@backend/server/identity/audit-writer', () => ({
  recordTenantAudit: mocks.audit,
}))

import {
  createApplication,
  listApplications,
  normalizeApplicationInput,
  rotateApplicationSecret,
} from '@backend/server/identity/application-service'

const tenantId = '11111111-1111-4111-8111-111111111111'
const applicationId = '22222222-2222-4222-8222-222222222222'

function applicationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: applicationId,
    tenant_id: tenantId,
    client_id: 'qts_test_client',
    name: 'CRM',
    type: 'CONFIDENTIAL',
    redirect_uris: ['https://crm.example.com/callback'],
    allowed_origins: ['https://crm.example.com'],
    scopes: ['openid', 'profile'],
    status: 'ACTIVE',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

describe('application service contracts', () => {
  it('rejects wildcard, fragment, and duplicate redirect URIs', () => {
    expect(() =>
      normalizeApplicationInput({
        name: 'CRM',
        type: 'PUBLIC',
        redirectUris: [
          'https://crm.example.com/*',
          'https://crm.example.com/callback#fragment',
        ],
        allowedOrigins: [],
        scopes: ['openid'],
      }),
    ).toThrow('Redirect URIs must be exact')

    expect(() =>
      normalizeApplicationInput({
        name: 'CRM',
        type: 'PUBLIC',
        redirectUris: [
          'https://crm.example.com/callback',
          'https://crm.example.com/callback',
        ],
        allowedOrigins: [],
        scopes: ['openid'],
      }),
    ).toThrow('Redirect URIs must be unique')

    expect(() =>
      normalizeApplicationInput({
        name: 'CRM',
        type: 'PUBLIC',
        redirectUris: ['http://public.example.com/callback'],
        allowedOrigins: [],
        scopes: ['openid'],
      }),
    ).toThrow('use HTTPS')
  })

  it('normalizes only safe URL presentation details and preserves exact paths', () => {
    expect(
      normalizeApplicationInput({
        name: ' CRM ',
        type: 'PUBLIC',
        redirectUris: [' HTTPS://CRM.EXAMPLE.COM/callback?state=1 '],
        allowedOrigins: ['HTTPS://CRM.EXAMPLE.COM/'],
        scopes: ['openid', 'openid', ' profile '],
      }),
    ).toEqual({
      name: 'CRM',
      type: 'PUBLIC',
      redirectUris: ['HTTPS://CRM.EXAMPLE.COM/callback?state=1'],
      allowedOrigins: ['https://crm.example.com'],
      scopes: ['openid', 'profile'],
    })
  })

  it('returns a raw secret only when creating a confidential application', async () => {
    mocks.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT id FROM identity.tenants')) {
        return { rowCount: 1, rows: [{ id: tenantId }] }
      }
      if (text.includes('INSERT INTO identity.applications')) {
        return { rowCount: 1, rows: [applicationRow()] }
      }
      return { rowCount: 0, rows: [] }
    })

    const result = await createApplication(
      tenantId,
      {
        name: 'CRM',
        type: 'CONFIDENTIAL',
        redirectUris: ['https://crm.example.com/callback'],
        allowedOrigins: [],
        scopes: ['openid'],
      },
      { actorSubject: 'admin-1' },
    )

    expect(result.clientSecret).toMatch(/^qts_secret_/)
    expect(result).not.toHaveProperty('clientSecretHash')
    const insertCall = mocks.query.mock.calls.find(([text]) =>
      String(text).includes('INSERT INTO identity.applications'),
    )
    expect(insertCall?.[1]).toContainEqual(expect.any(String))
    expect(insertCall?.[1]).not.toContain(result.clientSecret)
  })

  it('never returns a stored secret from list and rotates confidential secrets once', async () => {
    mocks.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: tenantId }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [applicationRow()] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: tenantId }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [applicationRow()] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [applicationRow()] })

    const listed = await listApplications(tenantId, { page: 1, pageSize: 20 })
    expect(listed.data[0]).not.toHaveProperty('clientSecret')
    expect(listed.data[0]).not.toHaveProperty('clientSecretHash')

    const rotated = await rotateApplicationSecret(tenantId, applicationId, {
      actorSubject: 'admin-1',
    })
    expect(rotated.clientSecret).toMatch(/^qts_secret_/)
    expect(rotated).not.toHaveProperty('clientSecretHash')
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'APPLICATION_SECRET_ROTATED' }),
    )
  })
})
