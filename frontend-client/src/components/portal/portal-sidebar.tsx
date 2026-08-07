'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { ComponentType } from 'react'

import { QtsLogo } from '@/components/shared/qts-logo'
import { Button } from '@/components/ui/button'
import { adminSurfaceLinks, adminSurfaceNavigation } from '@/config/admin'
import { accountNavigation, portalNavigation } from '@client/config/portal'
import type { AuthUser } from '@/lib/auth/session'
import {
  hasPermission,
  permissionForPortalRoute,
} from '@/lib/domain/permissions'
import { cn } from '@/lib/utils'

type PortalSidebarProps = {
  user: AuthUser
  surface?: 'portal' | 'admin'
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export function PortalSidebar({
  user,
  surface = 'portal',
  collapsed = false,
  onToggle,
  onNavigate,
  mobile = false,
}: PortalSidebarProps) {
  const pathname = usePathname()
  const isAdminSurface = surface === 'admin'
  const renderItems = (
    items: readonly {
      label: string
      href: string
      icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
      roles?: readonly string[]
      permission?: string
    }[],
  ) =>
    items.map((item) => {
      let allowed = true
      if (item.permission) {
        allowed = hasPermission(user, item.permission)
      } else {
        const routePermission = permissionForPortalRoute(item.href)
        if (routePermission && user.permissions) {
          allowed = hasPermission(user, routePermission)
        } else if (item.roles) {
          allowed = item.roles.includes(user.role)
        }
      }
      if (!allowed) return null
      const active =
        pathname === item.href || pathname.startsWith(`${item.href}/`)
      const Icon = item.icon
      return (
        <Link
          href={item.href}
          className={cn(active && 'is-active')}
          aria-current={active ? 'page' : undefined}
          onClick={onNavigate}
          key={item.href}
        >
          <Icon size={18} aria-hidden />
          <span>{item.label}</span>
        </Link>
      )
    })

  return (
    <aside
      className={cn(
        'portal-sidebar',
        isAdminSurface && 'portal-sidebar--admin',
        mobile && 'portal-sidebar--mobile',
      )}
    >
      <div className="portal-sidebar__brand">
        <QtsLogo
          href={isAdminSurface ? '/admin' : '/portal/dashboard'}
          inverse
          compact={collapsed && !mobile}
        />
        {onToggle && !mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </Button>
        )}
      </div>
      <nav
        aria-label={
          isAdminSurface ? 'Điều hướng quản trị' : 'Điều hướng portal'
        }
      >
        {isAdminSurface ? (
          <>
            <span className="portal-sidebar__label">Điều hành</span>
            {renderItems(adminSurfaceNavigation)}
            <span className="portal-sidebar__label">Chuyển bề mặt</span>
            {renderItems(adminSurfaceLinks)}
          </>
        ) : (
          <>
            <span className="portal-sidebar__label">Vận hành</span>
            {renderItems(portalNavigation)}
            <span className="portal-sidebar__label">Tài khoản</span>
            {renderItems(accountNavigation)}
            {hasPermission(user, 'admin.access') && (
              <>
                <span className="portal-sidebar__label">Quản trị</span>
                {renderItems([adminSurfaceNavigation[0]])}
              </>
            )}
          </>
        )}
      </nav>
      <div className="portal-sidebar__context">
        <span>{user.name.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{user.name}</strong>
          <small>
            {isAdminSurface
              ? 'QTS Admin'
              : (user.organizationName ?? 'QTS Portal')}
          </small>
        </div>
      </div>
    </aside>
  )
}
