import { describe, expect, it } from 'vitest'

import {
  canAccessOrganization,
  canAccessPortalRoute,
  canManageBlog,
} from '@/lib/domain/permissions'

describe('portal permissions', () => {
  it('keeps the admin area exclusive to administrators', () => {
    expect(canAccessPortalRoute('ADMIN', '/portal/admin/users')).toBe(true)
    expect(canAccessPortalRoute('STAFF', '/portal/admin/users')).toBe(false)
    expect(canAccessPortalRoute('CUSTOMER', '/portal/admin')).toBe(false)
  })

  it('allows every authenticated role to use shared portal routes', () => {
    expect(canAccessPortalRoute('ADMIN', '/portal/projects')).toBe(true)
    expect(canAccessPortalRoute('STAFF', '/portal/tickets')).toBe(true)
    expect(canAccessPortalRoute('CUSTOMER', '/portal/profile')).toBe(true)
  })

  it('prevents customer cross-organization access', () => {
    expect(canAccessOrganization('CUSTOMER', 'org-a', 'org-a')).toBe(true)
    expect(canAccessOrganization('CUSTOMER', 'org-a', 'org-b')).toBe(false)
    expect(canAccessOrganization('STAFF', null, 'org-b')).toBe(false)
    expect(
      canAccessOrganization(
        {
          role: 'STAFF',
          permissionKeys: ['portal.projects.assign.all'],
        },
        null,
        'org-b',
      ),
    ).toBe(true)
  })

  it('lets only administrators manage public content', () => {
    expect(canManageBlog('ADMIN')).toBe(true)
    expect(canManageBlog('STAFF')).toBe(false)
    expect(canManageBlog('CUSTOMER')).toBe(false)
  })
})
