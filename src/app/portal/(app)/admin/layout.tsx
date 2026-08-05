import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { requirePortalUser } from '@/lib/auth/guards'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requirePortalUser()
  if (user.role !== 'ADMIN') redirect('/403')
  return children
}
