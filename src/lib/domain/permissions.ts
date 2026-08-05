export type RoleName = 'ADMIN' | 'STAFF' | 'CUSTOMER'

const sharedPortalRoutes = [
  '/portal/dashboard',
  '/portal/projects',
  '/portal/tasks',
  '/portal/tickets',
  '/portal/documents',
  '/portal/contracts',
  '/portal/invoices',
  '/portal/notifications',
  '/portal/announcements',
  '/portal/profile',
  '/portal/settings',
] as const

export function canAccessPortalRoute(role: RoleName, pathname: string) {
  if (pathname === '/portal/admin' || pathname.startsWith('/portal/admin/')) {
    return role === 'ADMIN'
  }

  return sharedPortalRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

export function canAccessOrganization(
  role: RoleName,
  userOrganizationId: string | null,
  resourceOrganizationId: string,
) {
  if (role === 'ADMIN' || role === 'STAFF') {
    return true
  }

  return Boolean(
    userOrganizationId && userOrganizationId === resourceOrganizationId,
  )
}

export function canManageBlog(role: RoleName) {
  return role === 'ADMIN'
}

export function canManageProjects(role: RoleName) {
  return role === 'ADMIN' || role === 'STAFF'
}

export function canManageTasks(role: RoleName) {
  return role === 'ADMIN' || role === 'STAFF'
}

export function canManageTicketStatus(role: RoleName) {
  return role === 'ADMIN' || role === 'STAFF'
}
