'use client'

import Link from 'next/link'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export type HeaderNotification = {
  id: string
  title: string
  message: string
  href: string | null
  readAt: string | null
  createdAt: string
}

export function NotificationMenu({
  notifications,
  canManage = true,
}: {
  notifications: HeaderNotification[]
  canManage?: boolean
}) {
  const router = useRouter()
  const unread = notifications.filter((item) => !item.readAt).length

  async function markAllRead() {
    await fetch('/api/portal/notifications/read-all', { method: 'POST' })
    router.refresh()
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          className="portal-icon-button"
          variant="ghost"
          size="icon"
          aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`}
        >
          <Bell size={19} aria-hidden="true" />
          {unread > 0 && <span className="notification-count">{unread}</span>}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="portal-dropdown notification-dropdown"
          align="end"
          sideOffset={8}
        >
          <div className="notification-dropdown__header">
            <div>
              <strong>Thông báo</strong>
              <small>{unread} chưa đọc</small>
            </div>
            {canManage && (
              <button type="button" onClick={markAllRead} disabled={!unread}>
                <CheckCheck size={15} aria-hidden="true" /> Đọc tất cả
              </button>
            )}
          </div>
          <div className="notification-dropdown__list">
            {notifications.length ? (
              notifications.map((notification) => (
                <DropdownMenu.Item asChild key={notification.id}>
                  <Link
                    className={notification.readAt ? undefined : 'is-unread'}
                    href={notification.href ?? '/portal/notifications'}
                  >
                    <span>{notification.title}</span>
                    <p>{notification.message}</p>
                    <small>{formatDate(notification.createdAt)}</small>
                  </Link>
                </DropdownMenu.Item>
              ))
            ) : (
              <p className="notification-dropdown__empty">Chưa có thông báo.</p>
            )}
          </div>
          <DropdownMenu.Item asChild>
            <Link
              className="notification-dropdown__all"
              href="/portal/notifications"
            >
              Xem tất cả thông báo
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
