import type { IdentityRole } from '@backend/server/identity/types'

export const ROLE_MANAGEMENT_ERROR = {
  code: 'ROLE_MANAGEMENT_REQUIRED',
  message:
    'Changing roles or modifying an administrator requires role-management access.',
} as const

export function getMembershipRoleMutationError(input: {
  existingRole: IdentityRole
  targetRole: IdentityRole
  actorRole?: IdentityRole
}) {
  if (
    (input.existingRole === 'ADMIN' || input.targetRole === 'ADMIN') &&
    input.actorRole !== 'ADMIN'
  ) {
    return ROLE_MANAGEMENT_ERROR
  }
  return null
}
