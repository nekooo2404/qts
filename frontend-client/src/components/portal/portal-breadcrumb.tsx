'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'

const labels: Record<string, string> = {
  dashboard: 'Tổng quan',
  projects: 'Dự án',
  tasks: 'Công việc',
  tickets: 'Ticket hỗ trợ',
  documents: 'Tài liệu',
  contracts: 'Hợp đồng',
  invoices: 'Hóa đơn',
  notifications: 'Thông báo',
  announcements: 'Bảng tin',
  profile: 'Hồ sơ',
  settings: 'Cài đặt',
  admin: 'Quản trị',
  users: 'Người dùng',
  roles: 'Vai trò',
  content: 'Nội dung',
  'audit-logs': 'Audit log',
}

export function PortalBreadcrumb({
  basePath = '/portal',
}: {
  basePath?: string
}) {
  const pathname = usePathname()
  const segments = pathname
    .replace(new RegExp(`^${basePath}`), '')
    .split('/')
    .filter(Boolean)

  return (
    <nav
      className="portal-breadcrumb"
      aria-label={
        basePath === '/admin' ? 'Breadcrumb quản trị' : 'Breadcrumb portal'
      }
    >
      <Link
        href={basePath === '/admin' ? '/admin' : '/portal/dashboard'}
        aria-label="Tổng quan"
      >
        <Home size={14} aria-hidden="true" />
      </Link>
      {segments.map((segment, index) => {
        const href = `${basePath}/${segments.slice(0, index + 1).join('/')}`
        const current = index === segments.length - 1
        const label = labels[segment] ?? (index > 0 ? 'Chi tiết' : segment)
        return (
          <span key={href}>
            <ChevronRight size={13} aria-hidden="true" />
            {current ? (
              <strong aria-current="page">{label}</strong>
            ) : (
              <Link href={href}>{label}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
