import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  FileCheck2,
  FileText,
  LifeBuoy,
} from 'lucide-react'

import { ChartCard } from '@/components/portal/chart-card'
import { EmptyState } from '@/components/portal/empty-state'
import { LazyDashboardCharts } from '@/components/portal/lazy-dashboard-charts'
import { MetricCard } from '@/components/portal/metric-card'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { ProjectProgress } from '@/components/portal/project-progress'
import { StatusBadge } from '@/components/portal/status-badge'
import { requirePortalUser } from '@/lib/auth/guards'
import { getDashboardData } from '@/server/repositories/portal'
import { formatDate, formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Tổng quan' }

export default async function PortalDashboardPage() {
  const user = await requirePortalUser()
  const data = await getDashboardData(user)
  const roleContext =
    user.role === 'CUSTOMER'
      ? `Dữ liệu của ${user.organizationName ?? 'tổ chức của bạn'}`
      : user.role === 'STAFF'
        ? 'Dữ liệu từ các dự án bạn được phân công'
        : 'Dữ liệu vận hành trên toàn hệ thống'
  const scheduledProjects = data.projects.filter((project) => project.dueDate)

  return (
    <div className="portal-page dashboard-page">
      <PortalPageHeader
        eyebrow="Trung tâm vận hành"
        title={`Chào ${user.name.split(' ').slice(-1)[0]}`}
        description={roleContext}
      />
      <section className="metric-grid" aria-label="Chỉ số tổng quan">
        {data.capabilities.projects && (
          <MetricCard
            label="Dự án đang thực hiện"
            value={data.metrics.activeProjects}
            detail="Đang trong trạng thái hoạt động"
            href="/portal/projects?status=ACTIVE"
            icon={BriefcaseBusiness}
          />
        )}
        {data.capabilities.tasks && (
          <MetricCard
            label="Công việc sắp đến hạn"
            value={data.metrics.tasksDueSoon}
            detail="Trong 14 ngày tới"
            href="/portal/tasks"
            icon={CalendarClock}
          />
        )}
        {data.capabilities.tickets && (
          <MetricCard
            label="Ticket đang mở"
            value={data.metrics.openTickets}
            detail="Cần theo dõi hoặc phản hồi"
            href="/portal/tickets"
            icon={LifeBuoy}
          />
        )}
        {data.capabilities.documents && (
          <MetricCard
            label="Tài liệu mới"
            value={data.metrics.recentDocuments}
            detail="Được thêm trong 30 ngày"
            href="/portal/documents"
            icon={FileText}
          />
        )}
        {data.capabilities.contracts && (
          <MetricCard
            label="Hợp đồng hiệu lực"
            value={data.metrics.activeContracts}
            detail="Dữ liệu tài chính là demo"
            href="/portal/contracts"
            icon={FileCheck2}
          />
        )}
      </section>

      {(data.capabilities.tasks || data.capabilities.tickets) && (
        <div className="dashboard-grid dashboard-grid--charts">
          {data.capabilities.tasks && (
            <ChartCard
              title="Trạng thái công việc"
              description="Phân bố theo phạm vi truy cập hiện tại"
            >
              <LazyDashboardCharts tasks={data.taskChart} tickets={[]} />
            </ChartCard>
          )}
          {data.capabilities.tickets && (
            <ChartCard
              title="Ticket theo ưu tiên"
              description="Mức độ cần xử lý của các yêu cầu"
            >
              <LazyDashboardCharts tasks={[]} tickets={data.ticketChart} />
            </ChartCard>
          )}
        </div>
      )}

      {(data.capabilities.projects ||
        data.capabilities.notifications ||
        data.capabilities.announcements) && (
        <div className="dashboard-grid dashboard-grid--content">
          {data.capabilities.projects && (
            <section className="portal-panel portal-panel--span-2">
              <header className="portal-panel__header">
                <div>
                  <h2>Tiến độ dự án</h2>
                  <p>Các dự án cập nhật gần nhất trong phạm vi của bạn.</p>
                </div>
                <Link href="/portal/projects">Xem tất cả</Link>
              </header>
              {data.projects.length ? (
                <div className="dashboard-project-list">
                  {data.projects.map((project) => (
                    <Link
                      href={`/portal/projects/${project.id}`}
                      key={project.id}
                    >
                      <div>
                        <strong>{project.name}</strong>
                        <span>
                          {project.code} · {project.organization.name}
                        </span>
                      </div>
                      <StatusBadge status={project.status} />
                      <ProjectProgress value={project.progress} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Chưa có dự án"
                  description="Dự án thuộc phạm vi tài khoản sẽ xuất hiện tại đây."
                />
              )}
            </section>
          )}

          {data.capabilities.notifications && (
            <section className="portal-panel">
              <header className="portal-panel__header">
                <div>
                  <h2>Thông báo mới</h2>
                  <p>Cập nhật dành riêng cho tài khoản.</p>
                </div>
                <BellRing size={18} aria-hidden />
              </header>
              {data.notifications.length ? (
                <div className="activity-list">
                  {data.notifications.map((item) => (
                    <Link
                      href={item.href ?? '/portal/notifications'}
                      className={item.readAt ? undefined : 'is-unread'}
                      key={item.id}
                    >
                      <span>{item.title}</span>
                      <p>{item.message}</p>
                      <small>{formatDateTime(item.createdAt)}</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="portal-panel__empty">Chưa có thông báo mới.</p>
              )}
            </section>
          )}

          {data.capabilities.projects && (
            <section className="portal-panel">
              <header className="portal-panel__header">
                <div>
                  <h2>Lịch triển khai</h2>
                  <p>Mốc gần nhất của các dự án.</p>
                </div>
                <CalendarClock size={18} aria-hidden />
              </header>
              {scheduledProjects.length ? (
                <div className="calendar-list">
                  {scheduledProjects.map((project) => (
                    <Link
                      href={`/portal/projects/${project.id}`}
                      key={project.id}
                    >
                      <time>{formatDate(project.dueDate)}</time>
                      <span>{project.name}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="portal-panel__empty">Chưa có lịch triển khai.</p>
              )}
            </section>
          )}

          {data.capabilities.announcements && (
            <section className="portal-panel">
              <header className="portal-panel__header">
                <div>
                  <h2>Bảng tin</h2>
                  <p>Thông báo vận hành từ QTS.</p>
                </div>
              </header>
              {data.announcements.length ? (
                <div className="announcement-compact">
                  {data.announcements.map((item) => (
                    <article key={item.id}>
                      <span>{formatDate(item.publishedAt)}</span>
                      <strong>{item.title}</strong>
                      <p>{item.content}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="portal-panel__empty">
                  Chưa có nội dung trên bảng tin.
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
