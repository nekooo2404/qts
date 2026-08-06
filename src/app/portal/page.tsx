import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/domain/permissions'

export default async function PortalIndexPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/portal/login')

  const destination = [
    ['portal.dashboard.read', '/portal/dashboard'],
    ['portal.projects.read', '/portal/projects'],
    ['portal.tasks.read', '/portal/tasks'],
    ['portal.tickets.read', '/portal/tickets'],
    ['portal.documents.read', '/portal/documents'],
    ['portal.contracts.read', '/portal/contracts'],
    ['portal.invoices.read', '/portal/invoices'],
    ['portal.notifications.read', '/portal/notifications'],
    ['portal.announcements.read', '/portal/announcements'],
    ['portal.profile.read', '/portal/profile'],
    ['portal.settings.read', '/portal/settings'],
    ['admin.access', '/admin'],
  ].find(([permission]) => hasPermission(user, permission))

  redirect(destination?.[1] ?? '/403')
}
