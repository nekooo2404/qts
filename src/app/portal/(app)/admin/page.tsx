import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpenText, ScrollText, UsersRound } from 'lucide-react'

import { MetricCard } from '@client/components/portal/metric-card'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Quản trị' }

export default async function AdminDashboardPage() {
  const currentUser = await requirePortalUser()
  const canViewUsers = hasPermission(currentUser, 'admin.users.read')
  const canViewContent = hasPermission(currentUser, 'admin.content.read')
  const canViewAudit = hasPermission(currentUser, 'admin.audit.read')
  const [users, publishedPosts, recentAudits] = await Promise.all([
    canViewUsers ? db.user.count() : Promise.resolve(null),
    canViewContent
      ? db.blogPost.count({ where: { status: 'PUBLISHED' } })
      : Promise.resolve(null),
    canViewAudit
      ? db.auditLog.findMany({
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 6,
        })
      : Promise.resolve([]),
  ])
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Control center"
        title="Quản trị hệ thống"
        description="Quan sát dữ liệu vận hành, nội dung và các thao tác quan trọng trên toàn QTS Admin."
      />
      <section className="metric-grid metric-grid--four">
        {canViewUsers && (
          <MetricCard
            label="Người dùng"
            value={users ?? '—'}
            detail="Tất cả tài khoản"
            href="/admin/users"
            icon={UsersRound}
          />
        )}
        {canViewContent && (
          <MetricCard
            label="Bài đã xuất bản"
            value={publishedPosts ?? '—'}
            detail="Hiển thị trên website"
            href="/admin/content"
            icon={BookOpenText}
          />
        )}
      </section>
      <div className="dashboard-grid dashboard-grid--content">
        {canViewAudit ? (
          <section className="portal-panel">
            <header className="portal-panel__header">
              <div>
                <h2>Audit gần đây</h2>
                <p>Thao tác bảo mật và quản trị.</p>
              </div>
              <Link href="/admin/audit-logs">
                <ScrollText size={18} />
              </Link>
            </header>
            <div className="audit-compact">
              {recentAudits.map((log) => (
                <article key={log.id}>
                  <strong>{log.action}</strong>
                  <span>
                    {log.entity}
                    {log.entityId ? ` · ${log.entityId}` : ''}
                  </span>
                  <small>
                    {log.user?.name ?? 'Hệ thống'} ·{' '}
                    {formatDateTime(log.createdAt)}
                  </small>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="portal-panel admin-restricted-panel">
            <ScrollText size={18} />
            <h2>Audit giới hạn</h2>
            <p>Tài khoản hiện tại không có quyền xem nhật ký quản trị.</p>
          </section>
        )}
      </div>
    </div>
  )
}
