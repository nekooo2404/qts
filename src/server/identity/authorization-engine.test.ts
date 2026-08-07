import { describe, expect, it } from 'vitest'

import { evaluateAuthorization } from '@/server/identity/authorization-engine'
import type {
  AuthorizationRequest,
  IdentityRole,
} from '@/server/identity/types'

function request(
  role: IdentityRole,
  overrides: AuthorizationRequest['subject']['permissionOverrides'] = {},
): AuthorizationRequest {
  return {
    subject: {
      userId: 'user-1',
      tenantId: 'tenant-1',
      membershipId: 'membership-1',
      role,
      attributes: { department: 'finance' },
      permissionOverrides: overrides,
    },
    permission: 'USER_CREATE',
    resource: {
      type: 'user',
      id: 'target-1',
      attributes: { department: 'finance', sensitivity: 'normal' },
    },
    action: 'create',
    environment: { networkZone: 'trusted' },
  }
}

function subject(
  overrides: Partial<AuthorizationRequest['subject']> = {},
): AuthorizationRequest['subject'] {
  return {
    userId: 'user-1',
    tenantId: 'tenant-1',
    membershipId: 'membership-1',
    role: 'EMPLOYEE',
    attributes: {},
    ...overrides,
  }
}

describe('identity authorization engine', () => {
  it('grants permissions from the membership role', () => {
    expect(evaluateAuthorization(request('ADMIN'))).toMatchObject({
      allowed: true,
      reason: 'ROLE_PERMISSION',
    })
  })

  it('uses tenant role permissions instead of a hard-coded role catalog', () => {
    const decision = evaluateAuthorization({
      subject: subject({ role: 'EMPLOYEE', rolePermissions: ['USER_READ'] }),
      permission: 'USER_READ',
      resource: { type: 'user' },
      action: 'user.read',
    })
    expect(decision.allowed).toBe(true)
  })

  it('fails closed when a NOT_EQUALS policy attribute is missing', () => {
    const decision = evaluateAuthorization({
      subject: subject({ rolePermissions: [] }),
      permission: 'USER_DELETE',
      resource: { type: 'user' },
      action: 'user.delete',
      policies: [
        {
          id: 'policy-1',
          name: 'Missing department',
          effect: 'ALLOW',
          resource: 'user',
          action: 'user.delete',
          enabled: true,
          conditions: [
            {
              attribute: 'subject.department',
              operator: 'NOT_EQUALS',
              value: 'finance',
            },
          ],
        },
      ],
    })
    expect(decision.allowed).toBe(false)
  })

  it('denies permissions absent from the role', () => {
    expect(evaluateAuthorization(request('EMPLOYEE'))).toMatchObject({
      allowed: false,
      reason: 'NO_MATCHING_PERMISSION',
    })
  })

  it('keeps role management exclusive to administrators by default', () => {
    expect(
      evaluateAuthorization({
        ...request('ADMIN'),
        permission: 'ROLE_MANAGE',
      }).allowed,
    ).toBe(true)
    expect(
      evaluateAuthorization({
        ...request('MANAGER'),
        permission: 'ROLE_MANAGE',
      }).allowed,
    ).toBe(false)
  })

  it('lets a membership allow override grant a permission', () => {
    expect(
      evaluateAuthorization(request('EMPLOYEE', { USER_CREATE: 'ALLOW' })),
    ).toMatchObject({ allowed: true, reason: 'MEMBERSHIP_ALLOW' })
  })

  it('makes a membership deny override authoritative', () => {
    expect(
      evaluateAuthorization(request('ADMIN', { USER_CREATE: 'DENY' })),
    ).toMatchObject({ allowed: false, reason: 'MEMBERSHIP_DENY' })
  })

  it('makes an applicable ABAC deny policy override RBAC', () => {
    const input = request('ADMIN')
    input.policies = [
      {
        id: 'policy-deny-untrusted',
        name: 'Block user creation outside trusted network',
        effect: 'DENY',
        resource: 'user',
        action: 'create',
        enabled: true,
        conditions: [
          {
            attribute: 'environment.networkZone',
            operator: 'NOT_EQUALS',
            value: 'corporate',
          },
        ],
      },
    ]

    expect(evaluateAuthorization(input)).toEqual({
      allowed: false,
      reason: 'ABAC_DENY',
      matchedPolicyIds: ['policy-deny-untrusted'],
    })
  })

  it('allows a matching ABAC policy to grant missing role access', () => {
    const input = request('EMPLOYEE')
    input.policies = [
      {
        id: 'policy-finance-create',
        name: 'Finance can provision finance users',
        effect: 'ALLOW',
        resource: 'user',
        action: 'create',
        enabled: true,
        conditions: [
          {
            attribute: 'subject.department',
            operator: 'EQUALS',
            value: 'finance',
          },
          {
            attribute: 'resource.department',
            operator: 'EQUALS',
            value: 'finance',
          },
        ],
      },
    ]

    expect(evaluateAuthorization(input)).toEqual({
      allowed: true,
      reason: 'ABAC_ALLOW',
      matchedPolicyIds: ['policy-finance-create'],
    })
  })

  it('rejects unsafe attribute paths instead of traversing prototypes', () => {
    const input = request('EMPLOYEE')
    input.policies = [
      {
        id: 'unsafe-policy',
        name: 'Unsafe policy',
        effect: 'ALLOW',
        resource: 'user',
        action: 'create',
        enabled: true,
        conditions: [
          {
            attribute: 'subject.__proto__.polluted',
            operator: 'EQUALS',
            value: true,
          },
        ],
      },
    ]

    expect(evaluateAuthorization(input).allowed).toBe(false)
  })
})
