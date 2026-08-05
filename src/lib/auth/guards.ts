import 'server-only'

import { redirect } from 'next/navigation'

import type { RoleName } from '@/lib/domain/permissions'
import { canAccessOrganization } from '@/lib/domain/permissions'
import { getCurrentUser, type AuthUser } from '@/lib/auth/session'

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

export function requireRole(user: AuthUser, roles: RoleName[]) {
  if (!roles.includes(user.role)) {
    throw new ForbiddenError()
  }
}

export function requireOrganizationAccess(
  user: AuthUser,
  resourceOrganizationId: string,
) {
  if (
    !canAccessOrganization(
      user.role,
      user.organizationId,
      resourceOrganizationId,
    )
  ) {
    throw new ForbiddenError()
  }
}
