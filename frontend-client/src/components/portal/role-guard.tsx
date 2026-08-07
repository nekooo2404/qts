import type { ReactNode } from 'react'

import type { RoleName } from '@/lib/domain/permissions'

export function RoleGuard({
  role,
  allow,
  children,
  fallback = null,
}: {
  role: RoleName
  allow: RoleName[]
  children: ReactNode
  fallback?: ReactNode
}) {
  return allow.includes(role) ? children : fallback
}
