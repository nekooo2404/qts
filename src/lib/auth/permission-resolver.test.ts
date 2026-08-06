import { describe, expect, it } from 'vitest'

import {
  resolvePermissionKeys,
  resolveRoleDefaultKeys,
} from '@/lib/auth/permission-resolver'

describe('permission resolver', () => {
  it('cascades a denied prerequisite to dependent actions', () => {
    const keys = resolvePermissionKeys(
      'STAFF',
      [],
      [{ key: 'portal.projects.read', effect: 'DENY' }],
    )

    expect(keys).not.toContain('portal.projects.read')
    expect(keys).not.toContain('portal.projects.create')
    expect(keys).not.toContain('portal.projects.update')
    expect(keys).not.toContain('portal.projects.read.all')
  })

  it('keeps an explicit admin access deny authoritative', () => {
    const keys = resolvePermissionKeys(
      'ADMIN',
      [],
      [{ key: 'admin.access', effect: 'DENY' }],
    )

    expect(keys).not.toContain('admin.access')
    expect(keys).not.toContain('admin.content.write')
    expect(keys).not.toContain('admin.permissions.manage')
  })

  it('allows a higher-level grant to provide its prerequisites', () => {
    const keys = resolvePermissionKeys(
      'CUSTOMER',
      [],
      [{ key: 'admin.permissions.manage', effect: 'ALLOW' }],
    )

    expect(keys).toContain('admin.permissions.manage')
    expect(keys).toContain('admin.permissions.read')
    expect(keys).toContain('admin.access')
  })

  it('keeps newly cataloged defaults available when persisted rows are partial', () => {
    const keys = resolvePermissionKeys(
      'ADMIN',
      [{ key: 'portal.dashboard.read', effect: 'ALLOW' }],
      [],
    )

    expect(keys).toContain('portal.projects.assign.all')
    expect(keys).toContain('portal.documents.upload.all')
  })

  it('reflects role-level denials without losing newer defaults', () => {
    const keys = resolveRoleDefaultKeys('ADMIN', [
      { key: 'portal.projects.read', effect: 'DENY' },
    ])

    expect(keys).not.toContain('portal.projects.read')
    expect(keys).toContain('portal.projects.assign.all')
  })
})
