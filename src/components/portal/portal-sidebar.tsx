'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { ComponentType } from 'react'

import { QtsLogo } from '@/components/shared/qts-logo'
import { Button } from '@/components/ui/button'
import {
  accountNavigation,
  adminNavigation,
  portalNavigation,
} from '@/config/portal'
import type { AuthUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

type PortalSidebarProps = {
  user: AuthUser
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export function PortalSidebar({
  user,
  collapsed = false,
  onToggle,
  onNavigate,
  mobile = false,
}: PortalSidebarProps) {
  const pathname = usePathname()
  const renderItems = (
    items: readonly {
      label: string
      href: string
      icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
      roles: readonly string[]
    }[],
  ) =>
    items
      .filter((item) => item.roles.includes(user.role))
      .map((item) => {
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
    <aside className={cn('portal-sidebar', mobile && 'portal-sidebar--mobile')}>
      <div className="portal-sidebar__brand">
        <QtsLogo
          href="/portal/dashboard"
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
      <nav aria-label="Điều hướng portal">
        <span className="portal-sidebar__label">Vận hành</span>
        {renderItems(portalNavigation)}
        <span className="portal-sidebar__label">Tài khoản</span>
        {renderItems(accountNavigation)}
        {user.role === 'ADMIN' && (
          <>
            <span className="portal-sidebar__label">Quản trị</span>
            {renderItems(adminNavigation)}
          </>
        )}
      </nav>
      <div className="portal-sidebar__context">
        <span>{user.name.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{user.name}</strong>
          <small>{user.organizationName ?? 'QTS Portal'}</small>
        </div>
      </div>
    </aside>
  )
}
