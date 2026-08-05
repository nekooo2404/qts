'use client'

import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { PortalHeader } from '@/components/portal/portal-header'
import { type HeaderNotification } from '@/components/portal/notification-menu'
import { PortalSidebar } from '@/components/portal/portal-sidebar'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

export function PortalShell({
  user,
  notifications,
  children,
}: {
  user: AuthUser
  notifications: HeaderNotification[]
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div
      className={cn(
        'portal-shell',
        collapsed && 'portal-shell--collapsed',
        dark && 'portal-shell--dark',
      )}
    >
      <PortalSidebar
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <div className="portal-workspace">
        <PortalHeader
          user={user}
          notifications={notifications}
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
              mobile
              onNavigate={() => setMobileOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
