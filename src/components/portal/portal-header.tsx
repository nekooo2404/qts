'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut, Menu, Moon, Sun, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  NotificationMenu,
  type HeaderNotification,
} from '@/components/portal/notification-menu'
import { PortalBreadcrumb } from '@/components/portal/portal-breadcrumb'
import { PortalSearch } from '@/components/portal/portal-search'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/lib/auth/session'

type PortalHeaderProps = {
  user: AuthUser
  notifications: HeaderNotification[]
  dark: boolean
  onToggleTheme: () => void
  onOpenMobile: () => void
}

export function PortalHeader({
  user,
  notifications,
  dark,
  onToggleTheme,
  onOpenMobile,
}: PortalHeaderProps) {
  const router = useRouter()

  async function logout() {
    const response = await fetch('/api/auth/logout', { method: 'POST' })
    if (response.ok) {
      router.replace('/portal/login')
      router.refresh()
    }
  }

  return (
    <header className="portal-header">
      <div className="portal-header__left">
        <Button
          className="portal-mobile-trigger"
          variant="ghost"
          size="icon"
          onClick={onOpenMobile}
          aria-label="Mở điều hướng portal"
        >
          <Menu size={20} />
        </Button>
        <PortalBreadcrumb />
      </div>
      <PortalSearch role={user.role} />
      <div className="portal-header__actions">
        <Button
          className="portal-icon-button"
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={
            dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'
          }
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <NotificationMenu notifications={notifications} />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="portal-user-trigger">
              <span>{user.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{user.name}</strong>
                <small>{user.roleLabel}</small>
              </div>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="portal-dropdown user-dropdown"
              align="end"
              sideOffset={8}
            >
              <DropdownMenu.Item asChild>
                <Link href="/portal/profile">
                  <UserRound size={16} /> Hồ sơ cá nhân
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item asChild>
                <button type="button" onClick={logout}>
                  <LogOut size={16} /> Đăng xuất
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
