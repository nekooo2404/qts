import { describe, expect, it } from 'vitest'

import { getMembershipRoleMutationError } from '@backend/server/identity/membership-policy'

describe('membership role safety', () => {
  it('allows an administrator to change ordinary membership roles', () => {
    expect(
      getMembershipRoleMutationError({
        existingRole: 'EMPLOYEE',
        targetRole: 'MANAGER',
        actorRole: 'ADMIN',
      }),
    ).toBeNull()
  })

  it('blocks a manager from promoting a member to administrator', () => {
    expect(
      getMembershipRoleMutationError({
        existingRole: 'EMPLOYEE',
        targetRole: 'ADMIN',
        actorRole: 'MANAGER',
      }),
    ).toEqual({
      code: 'ROLE_MANAGEMENT_REQUIRED',
      message:
        'Changing roles or modifying an administrator requires role-management access.',
    })
  })

  it('blocks a manager from suspending or removing an administrator', () => {
    expect(
      getMembershipRoleMutationError({
        existingRole: 'ADMIN',
        targetRole: 'ADMIN',
        actorRole: 'MANAGER',
      }),
    ).not.toBeNull()
  })
})
