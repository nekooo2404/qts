import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { requirePortalUser } from '@/lib/auth/guards'
import {
  hasPermission,
  permissionForPortalRoute,
} from '@/lib/domain/permissions'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requirePortalUser()
  if (!hasPermission(user, 'admin.access')) redirect('/403')
  const pathname = (await headers()).get('x-qts-pathname')
  const requiredPermission = pathname
    ? permissionForPortalRoute(pathname)
    : null
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    redirect('/403')
  }
  return children
}
