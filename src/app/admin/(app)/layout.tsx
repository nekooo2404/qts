import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { PortalShell } from '@/components/portal/portal-shell'
import { requirePortalUser } from '@/lib/auth/guards'
import {
  hasPermission,
  permissionForPortalRoute,
} from '@/lib/domain/permissions'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: { default: 'QTS Admin', template: '%s | QTS Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode
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

  const records = hasPermission(user, 'portal.notifications.read')
    ? await db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
      })
    : []
  const notifications = records.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
  }))

  return (
    <PortalShell user={user} notifications={notifications} surface="admin">
      {children}
    </PortalShell>
  )
}
