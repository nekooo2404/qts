import type { Metadata } from 'next'

import {
  PermissionWorkbench,
  type PermissionCatalogItem,
  type PermissionUser,
} from '@admin/components/admin/permission-workbench'
import { hasPermission, PERMISSION_CATALOG } from '@/lib/domain/permissions'
import { requirePortalUser } from '@/lib/auth/guards'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Quyền truy cập' }

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const currentUser = await requirePortalUser()
  const query = await searchParams
  const initialUserId = typeof query.user === 'string' ? query.user : undefined
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      role: { select: { name: true } },
    },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  })

  const userOptions: PermissionUser[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    role: user.role.name,
  }))
  const catalog: PermissionCatalogItem[] = PERMISSION_CATALOG.map((item) => ({
    ...item,
  }))

  return (
    <div className="portal-page admin-permissions-page">
      <PermissionWorkbench
        users={userOptions}
        catalog={catalog}
        initialUserId={initialUserId}
        canManage={hasPermission(currentUser, 'admin.permissions.manage')}
      />
    </div>
  )
}
