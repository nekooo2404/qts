import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { PortalShell } from '@client/components/portal/portal-shell'
import {
  hasPermission,
  permissionForPortalRoute,
} from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { getCurrentUser, type AuthUser } from '@/lib/auth/session'
import { isIdentityPlatformConfigured } from '@backend/server/identity/config'
import {
  getIdentitySessionPrincipal,
  principalHasStrongAuthentication,
} from '@backend/server/identity/keycloak'

function identityAdminUser(session: {
  subject: string
  email: string | null
  displayName: string | null
}): AuthUser {
  const permissions = [
    'admin.access',
    'admin.dashboard.read',
    'admin.identity.read',
    'admin.audit.read',
  ] as const
  return {
    id: `identity:${session.subject}`,
    email: session.email ?? 'identity-admin@qts.local',
    name: session.displayName ?? 'Identity platform administrator',
    phone: null,
    title: 'Identity platform administrator',
    avatarUrl: null,
    role: 'ADMIN',
    roleLabel: 'Identity platform administrator',
    organizationId: null,
    organizationName: null,
    permissions: [...permissions],
    permissionKeys: [...permissions],
  }
}

export const metadata: Metadata = {
  title: { default: 'QTS Admin', template: '%s | QTS Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = await headers()
  const pathname = requestHeaders.get('x-qts-pathname')
  const isIdentitySurface = pathname?.startsWith('/admin/identity') ?? false
  let user =
    isIdentitySurface && isIdentityPlatformConfigured()
      ? null
      : await getCurrentUser()
  if (isIdentitySurface && isIdentityPlatformConfigured()) {
    const identityPrincipal = await getIdentitySessionPrincipal()
    if (identityPrincipal) {
      if (
        !identityPrincipal.realmRoles.includes('platform-admin') ||
        !principalHasStrongAuthentication(identityPrincipal)
      ) {
        redirect('/403')
      }
      user = identityAdminUser(identityPrincipal)
    } else if (process.env.NODE_ENV !== 'production') {
      // The legacy bridge keeps local demo accounts usable while Keycloak is
      // not populated; production never falls back to the Portal session.
      user = await getCurrentUser()
    }
  }
  if (!user) redirect('/portal/login')
  if (!hasPermission(user, 'admin.access')) redirect('/403')
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
