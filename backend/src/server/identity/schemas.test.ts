import { describe, expect, it } from 'vitest'

import {
  applicationSchema,
  createTenantDomainSchema,
  createTenantSchema,
  membershipUpdateSchema,
  membershipPermissionOverridesSchema,
} from '@backend/server/identity/schemas'

describe('identity API schemas', () => {
  it('accepts a valid tenant and applies safe defaults', () => {
    expect(
      createTenantSchema.parse({ key: 'acme-vn', name: 'Acme Vietnam' }),
    ).toMatchObject({
      key: 'acme-vn',
      plan: 'STARTER',
      status: 'PROVISIONING',
      branding: {},
    })
  })

  it('rejects tenant keys that cannot be used as stable identifiers', () => {
    expect(
      createTenantSchema.safeParse({ key: 'Acme VN', name: 'Acme Vietnam' })
        .success,
    ).toBe(false)
  })

  it('rejects insecure remote tenant branding assets', () => {
    expect(
      createTenantSchema.safeParse({
        key: 'acme-vn',
        name: 'Acme Vietnam',
        branding: { logoUrl: 'http://cdn.example.test/logo.png' },
      }).success,
    ).toBe(false)
  })

  it('normalizes custom domains to lowercase', () => {
    expect(
      createTenantDomainSchema.parse({ hostname: 'LOGIN.ACME.COM' }).hostname,
    ).toBe('login.acme.com')
  })

  it('requires exact application redirect URIs', () => {
    expect(
      applicationSchema.safeParse({
        name: 'CRM',
        redirectUris: ['not-a-url'],
      }).success,
    ).toBe(false)
  })

  it('rejects duplicate per-member permission overrides', () => {
    expect(
      membershipPermissionOverridesSchema.safeParse({
        overrides: [
          { permission: 'REPORT_VIEW', effect: 'ALLOW' },
          { permission: 'REPORT_VIEW', effect: 'DENY' },
        ],
      }).success,
    ).toBe(false)
  })

  it('rejects an empty membership update payload', () => {
    expect(membershipUpdateSchema.safeParse({}).success).toBe(false)
  })
})
