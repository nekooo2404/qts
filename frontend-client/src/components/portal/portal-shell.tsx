'use client'

import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { PortalHeader } from '@client/components/portal/portal-header'
import { type HeaderNotification } from '@client/components/portal/notification-menu'
import { PortalSidebar } from '@client/components/portal/portal-sidebar'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

export function PortalShell({
  user,
  notifications,
  surface = 'portal',
  children,
}: {
  user: AuthUser
  notifications: HeaderNotification[]
  surface?: 'portal' | 'admin'
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div
      className={cn(
        'portal-shell',
        surface === 'admin' && 'portal-shell--admin',
        collapsed && 'portal-shell--collapsed',
        dark && 'portal-shell--dark',
      )}
    >
      <PortalSidebar
        user={user}
        surface={surface}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <div className="portal-workspace">
        <PortalHeader
          user={user}
          notifications={notifications}
          surface={surface}
          dark={dark}
          onToggleTheme={() => setDark((value) => !value)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main id="main-content" className="portal-main">
          {children}
        </main>
      </div>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="portal-mobile-drawer">
            <Dialog.Title className="sr-only">Điều hướng portal</Dialog.Title>
            <Dialog.Close asChild>
              <Button
                className="portal-mobile-drawer__close"
                variant="ghost"
                size="icon"
                aria-label="Đóng điều hướng"
              >
                <X size={20} />
              </Button>
            </Dialog.Close>
            <PortalSidebar
              user={user}
              surface={surface}
              mobile
              onNavigate={() => setMobileOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
