import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpenText,
  ContactRound,
  LifeBuoy,
  ScrollText,
  UsersRound,
} from 'lucide-react'

import { MetricCard } from '@/components/portal/metric-card'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Quản trị' }

export default async function AdminDashboardPage() {
  const [users, openTickets, leads, publishedPosts, recentAudits, recentLeads] =
    await Promise.all([
      db.user.count(),
      db.ticket.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      db.contactLead.count({ where: { status: 'NEW' } }),
      db.blogPost.count({ where: { status: 'PUBLISHED' } }),
      db.auditLog.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      db.contactLead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ])
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Control center"
        title="Quản trị hệ thống"
        description="Quan sát dữ liệu vận hành, nội dung và các thao tác quan trọng trên toàn QTS Portal."
      />
      <section className="metric-grid metric-grid--four">
        <MetricCard
          label="Người dùng"
          value={users}
          detail="Tất cả tài khoản"
          href="/portal/admin/users"
          icon={UsersRound}
        />
        <MetricCard
          label="Ticket đang mở"
          value={openTickets}
          detail="Toàn hệ thống"
          href="/portal/tickets"
          icon={LifeBuoy}
        />
        <MetricCard
          label="Lead mới"
          value={leads}
          detail="Từ form công khai"
          href="/portal/admin"
          icon={ContactRound}
        />
        <MetricCard
          label="Bài đã xuất bản"
          value={publishedPosts}
          detail="Hiển thị trên website"
          href="/portal/admin/content"
          icon={BookOpenText}
        />
      </section>
      <div className="dashboard-grid dashboard-grid--content">
        <section className="portal-panel">
          <header className="portal-panel__header">
            <div>
              <h2>Lead gần đây</h2>
              <p>Thông tin từ form liên hệ công khai.</p>
            </div>
            <ContactRound size={18} />
          </header>
          <div className="admin-lead-list">
            {recentLeads.map((lead) => (
              <article key={lead.id}>
                <div>
                  <strong>{lead.name}</strong>
                  <span>{lead.company ?? 'Không cung cấp công ty'}</span>
                </div>
                <StatusBadge status={lead.status} />
                <p>{lead.message}</p>
                <small>
                  {lead.email} · {formatDateTime(lead.createdAt)}
                </small>
              </article>
            ))}
          </div>
        </section>
        <section className="portal-panel">
          <header className="portal-panel__header">
            <div>
              <h2>Audit gần đây</h2>
              <p>Thao tác bảo mật và quản trị.</p>
            </div>
            <Link href="/portal/admin/audit-logs">
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
      </div>
    </div>
  )
}
