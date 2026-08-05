import type { Metadata } from 'next'

import { PortalShell } from '@/components/portal/portal-shell'
import { requirePortalUser } from '@/lib/auth/guards'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: { default: 'QTS Portal', template: '%s | QTS Portal' },
  robots: { index: false, follow: false },
}

export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requirePortalUser()
  const records = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  const notifications = records.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
  }))
  return (
    <PortalShell user={user} notifications={notifications}>
      {children}
    </PortalShell>
  )
}
