import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import {
  resolvePermissionKeys,
  type PermissionAssignment,
} from '@/lib/auth/permission-resolver'
import type { RoleName } from '@/lib/domain/permissions'

export type PermissionManagerMutation = {
  userId: string
  active?: boolean
  role?: RoleName
  overrides?: readonly PermissionAssignment[]
}

/** Evaluate the effective manager set after applying one hypothetical change. */
export async function hasActivePermissionManager(
  tx: Prisma.TransactionClient,
  mutation?: PermissionManagerMutation,
) {
  const users = await tx.user.findMany({
    where: mutation
      ? { OR: [{ active: true }, { id: mutation.userId }] }
      : { active: true },
    select: {
      id: true,
      active: true,
      role: {
        select: {
          name: true,
          permissions: {
            select: { effect: true, permission: { select: { key: true } } },
          },
        },
      },
      permissionOverrides: {
        select: { effect: true, permission: { select: { key: true } } },
      },
    },
  })

  const replacementRole = mutation?.role
    ? await tx.role.findUnique({
        where: { name: mutation.role },
        select: {
          name: true,
          permissions: {
            select: { effect: true, permission: { select: { key: true } } },
          },
        },
      })
    : null

  return users.some((user) => {
    const isTarget = user.id === mutation?.userId
    const active =
      isTarget && mutation?.active !== undefined ? mutation.active : user.active
    if (!active) return false

    const role = isTarget && replacementRole ? replacementRole : user.role
    const roleDefaults = role.permissions.map((item) => ({
      key: item.permission.key,
      effect: item.effect,
    }))
    const persistedOverrides = user.permissionOverrides.map((item) => ({
      key: item.permission.key,
      effect: item.effect,
    }))
    const overrides =
      isTarget && mutation?.overrides !== undefined
        ? mutation.overrides
        : persistedOverrides

    const effectiveKeys = resolvePermissionKeys(
      role.name,
      roleDefaults,
      overrides,
    )
    return (
      effectiveKeys.includes('admin.access') &&
      effectiveKeys.includes('admin.permissions.manage')
    )
  })
}

export class LastPermissionManagerError extends Error {
  constructor() {
    super('At least one active permission manager is required.')
    this.name = 'LastPermissionManagerError'
  }
}
