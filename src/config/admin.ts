import {
  ArrowLeftRight,
  BookOpenText,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'

/**
 * Navigation for the administrative surface.  Permission evaluation belongs
 * to the server/auth layer; `permission` is the stable capability key the
 * sidebar can use once per-user grants are loaded into the session.
 */
export const adminSurfaceNavigation = [
  {
    label: 'Tổng quan',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'admin.dashboard.read',
  },
  {
    label: 'Người dùng',
    href: '/admin/users',
    icon: UsersRound,
    permission: 'admin.users.read',
  },
  {
    label: 'Quyền truy cập',
    href: '/admin/roles',
    icon: ShieldCheck,
    permission: 'admin.permissions.read',
  },
  {
    label: 'Nội dung',
    href: '/admin/content',
    icon: BookOpenText,
    permission: 'admin.content.read',
  },
  {
    label: 'Nhật ký',
    href: '/admin/audit-logs',
    icon: ScrollText,
    permission: 'admin.audit.read',
  },
] as const

export const adminSurfaceLinks = [
  {
    label: 'Về Portal',
    href: '/portal/dashboard',
    icon: ArrowLeftRight,
    permission: 'portal.dashboard.read',
  },
] as const
