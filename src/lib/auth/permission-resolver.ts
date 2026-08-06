import {
  applyPermissionDenials,
  expandPermissionKeys,
  PERMISSION_CATALOG,
  ROLE_DEFAULT_PERMISSION_KEYS,
  type PermissionKey,
  type RoleName,
} from '@/lib/domain/permissions'

export type PermissionEffect = 'ALLOW' | 'DENY'

export type PermissionAssignment = {
  key: string
  effect: PermissionEffect
}

const catalogKeys = new Set<string>(PERMISSION_CATALOG.map((item) => item.key))

/**
 * Keep the code catalog authoritative for defaults while honoring any
 * persisted role-level ALLOW/DENY rows from older database snapshots.
 */
export function resolveRoleDefaultKeys(
  role: RoleName,
  persistedRoleDefaults: readonly PermissionAssignment[],
): PermissionKey[] {
  const defaults = new Set<string>(ROLE_DEFAULT_PERMISSION_KEYS[role])
  for (const assignment of persistedRoleDefaults) {
    if (!catalogKeys.has(assignment.key)) continue
    if (assignment.effect === 'ALLOW') defaults.add(assignment.key)
    else defaults.delete(assignment.key)
  }
  return PERMISSION_CATALOG.filter((item) => defaults.has(item.key)).map(
    (item) => item.key,
  )
}

/**
 * Resolve role defaults plus explicit account overrides. A DENY always removes
 * a role default and an ALLOW always adds it.
 */
export function resolvePermissionKeys(
  role: RoleName,
  persistedRoleDefaults: readonly PermissionAssignment[],
  userOverrides: readonly PermissionAssignment[],
): PermissionKey[] {
  const defaults = resolveRoleDefaultKeys(role, persistedRoleDefaults)
  const directlyAllowed = new Set<string>(defaults)
  const denied = new Set<string>(
    persistedRoleDefaults
      .filter((item) => item.effect === 'DENY' && catalogKeys.has(item.key))
      .map((item) => item.key),
  )

  for (const override of userOverrides) {
    if (!catalogKeys.has(override.key)) continue
    if (override.effect === 'ALLOW') directlyAllowed.add(override.key)
    else denied.add(override.key)
  }

  const expanded = expandPermissionKeys(directlyAllowed)
  applyPermissionDenials(expanded, denied)
  return PERMISSION_CATALOG.filter((item) => expanded.has(item.key)).map(
    (item) => item.key,
  )
}

export function getPermissionAssignments<T extends PermissionAssignment>(
  assignments: readonly T[],
) {
  return assignments.map((assignment) => ({
    key: assignment.key,
    effect: assignment.effect,
  }))
}
