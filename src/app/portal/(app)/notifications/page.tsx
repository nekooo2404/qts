import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, CheckCircle2, Info, Send, TriangleAlert } from 'lucide-react'

import { NotificationActions } from '@/components/portal/notification-actions'
import { NotificationComposer } from '@/components/portal/notification-composer'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { requirePortalUser } from '@/lib/auth/guards'
import { db } from '@/lib/db'
import { cn, formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Thông báo' }
const typeIcons = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: TriangleAlert,
  ACTION_REQUIRED: Bell,
}

export default async function PortalNotificationsPage() {
  const user = await requirePortalUser()
  const [notifications, recipients] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    user.role === 'CUSTOMER'
      ? Promise.resolve([])
      : db.user.findMany({
          where: {
            active: true,
            id: { not: user.id },
            ...(user.role === 'STAFF'
              ? { role: { name: 'CUSTOMER' as const } }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            organization: { select: { name: true } },
          },
          orderBy: { name: 'asc' },
        }),
  ])
  const unread = notifications.filter((item) => !item.readAt).length
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Inbox"
        title="Thông báo"
        description={`${unread} thông báo chưa đọc. Mỗi liên kết chỉ mở tài nguyên mà tài khoản hiện có quyền truy cập.`}
        actions={unread ? <NotificationActions all /> : undefined}
      />
      <div className="notification-page-list">
        {notifications.length ? (
          notifications.map((notification) => {
            const Icon = typeIcons[notification.type]
            return (
              <article
                className={cn(!notification.readAt && 'is-unread')}
                key={notification.id}
              >
                <div className="notification-page-list__icon">
                  <Icon size={18} />
                </div>
                <div>
                  <header>
                    <strong>{notification.title}</strong>
                    <time>{formatDateTime(notification.createdAt)}</time>
                  </header>
                  <p>{notification.message}</p>
                  {notification.href && (
                    <Link href={notification.href}>
                      Mở tài nguyên liên quan
                    </Link>
                  )}
                </div>
                {!notification.readAt && (
                  <NotificationActions id={notification.id} />
                )}
              </article>
            )
          })
        ) : (
          <div className="empty-state">
            <Bell size={28} />
            <h2>Chưa có thông báo</h2>
            <p>Cập nhật dành cho tài khoản sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>
      {user.role !== 'CUSTOMER' && (
        <details className="portal-panel portal-create-panel">
          <summary>
            <Send size={18} /> Gửi thông báo cho khách hàng
          </summary>
          <div className="portal-create-panel__body">
            <h2>Thông báo trực tiếp</h2>
            <p>
              STAFF chỉ gửi được cho tài khoản CUSTOMER; ADMIN có thể chọn mọi
              tài khoản đang hoạt động.
            </p>
            <NotificationComposer recipients={recipients} />
          </div>
        </details>
      )}
    </div>
  )
}
