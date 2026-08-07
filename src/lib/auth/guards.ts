import 'server-only'

import { redirect } from 'next/navigation'

import {
  canAccessOrganization,
  hasPermission,
  type PermissionKey,
} from '@/lib/domain/permissions'
import { getCurrentUser } from '@/lib/auth/session'
import type { AuthUser } from '@/lib/auth/types'

export class ForbiddenError extends Error {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export async function requirePortalUser(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/portal/login')
  }

  return user
}

export function requirePermission(
  user: AuthUser,
  permission: PermissionKey | string,
) {
  if (!hasPermission(user, permission)) {
    throw new ForbiddenError()
  }
}

export function requireAdminAccess(user: AuthUser) {
  requirePermission(user, 'admin.access')
}

export function requireOrganizationAccess(
  user: AuthUser,
  resourceOrganizationId: string,
) {
  if (
    !canAccessOrganization(user, user.organizationId, resourceOrganizationId)
  ) {
    throw new ForbiddenError()
  }
}
