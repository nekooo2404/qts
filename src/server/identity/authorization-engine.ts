import {
  type AbacPolicy,
  type AuthorizationDecision,
  type AuthorizationRequest,
  type IdentityPermission,
  type IdentityRole,
  type PolicyCondition,
} from '@/server/identity/types'

const ROLE_PERMISSIONS: Record<IdentityRole, readonly IdentityPermission[]> = {
  ADMIN: [
    'USER_CREATE',
    'USER_READ',
    'USER_UPDATE',
    'USER_DELETE',
    'ROLE_MANAGE',
    'REPORT_VIEW',
    'IDP_CONFIGURE',
    'APPLICATION_MANAGE',
    'AUDIT_VIEW',
    'POLICY_MANAGE',
  ],
  MANAGER: ['USER_CREATE', 'USER_READ', 'USER_UPDATE', 'REPORT_VIEW'],
  EMPLOYEE: ['REPORT_VIEW'],
}

const forbiddenPathSegments = new Set(['__proto__', 'constructor', 'prototype'])

function readAttribute(source: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.')
  if (
    !segments.length ||
    segments.some(
      (segment) =>
        !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(segment) ||
        forbiddenPathSegments.has(segment),
    )
  ) {
    return undefined
  }

  let current: unknown = source
  for (const segment of segments) {
    if (
      !current ||
      typeof current !== 'object' ||
      Array.isArray(current) ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function valuesEqual(left: unknown, right: unknown) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(left) === JSON.stringify(right)
  }
  return left === right
}

function matchesCondition(
  condition: PolicyCondition,
  context: Record<string, unknown>,
) {
  const actual = readAttribute(context, condition.attribute)
  // A missing attribute must never satisfy a policy by accident. This keeps
  // NOT_EQUALS fail-closed for incomplete or untrusted identity claims.
  if (actual === undefined) return false
  switch (condition.operator) {
    case 'EQUALS':
      return valuesEqual(actual, condition.value)
    case 'NOT_EQUALS':
      return !valuesEqual(actual, condition.value)
    case 'IN':
      return Array.isArray(condition.value)
        ? condition.value.some((value) => valuesEqual(actual, value))
        : false
    case 'CONTAINS':
      return Array.isArray(actual)
        ? actual.some((value) => valuesEqual(value, condition.value))
        : typeof actual === 'string' && typeof condition.value === 'string'
          ? actual.includes(condition.value)
          : false
  }
}

function matchesPolicy(
  policy: AbacPolicy,
  request: AuthorizationRequest,
  context: Record<string, unknown>,
) {
  return (
    policy.enabled &&
    (policy.resource === '*' || policy.resource === request.resource.type) &&
    (policy.action === '*' || policy.action === request.action) &&
    policy.conditions.every((condition) => matchesCondition(condition, context))
  )
}

export function evaluateAuthorization(
  request: AuthorizationRequest,
): AuthorizationDecision {
  const override = request.subject.permissionOverrides?.[request.permission]
  if (override === 'DENY') {
    return {
      allowed: false,
      reason: 'MEMBERSHIP_DENY',
      matchedPolicyIds: [],
    }
  }

  const context: Record<string, unknown> = {
    subject: {
      userId: request.subject.userId,
      tenantId: request.subject.tenantId,
      membershipId: request.subject.membershipId,
      role: request.subject.role,
      ...request.subject.attributes,
    },
    resource: {
      type: request.resource.type,
      id: request.resource.id,
      ...request.resource.attributes,
    },
    environment: request.environment ?? {},
  }

  const matchingPolicies = (request.policies ?? []).filter((policy) =>
    matchesPolicy(policy, request, context),
  )
  const deniedBy = matchingPolicies.filter((policy) => policy.effect === 'DENY')
  if (deniedBy.length) {
    return {
      allowed: false,
      reason: 'ABAC_DENY',
      matchedPolicyIds: deniedBy.map((policy) => policy.id),
    }
  }

  if (override === 'ALLOW') {
    return {
      allowed: true,
      reason: 'MEMBERSHIP_ALLOW',
      matchedPolicyIds: [],
    }
  }

  const rolePermissions =
    request.subject.rolePermissions ?? ROLE_PERMISSIONS[request.subject.role]
  if (rolePermissions.includes(request.permission)) {
    return {
      allowed: true,
      reason: 'ROLE_PERMISSION',
      matchedPolicyIds: [],
    }
  }

  const allowedBy = matchingPolicies.filter(
    (policy) => policy.effect === 'ALLOW',
  )
  if (allowedBy.length) {
    return {
      allowed: true,
      reason: 'ABAC_ALLOW',
      matchedPolicyIds: allowedBy.map((policy) => policy.id),
    }
  }

  return {
    allowed: false,
    reason: 'NO_MATCHING_PERMISSION',
    matchedPolicyIds: [],
  }
}
