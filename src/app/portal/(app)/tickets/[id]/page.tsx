import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Building2,
  CalendarClock,
  FolderKanban,
  LifeBuoy,
  UserRound,
} from 'lucide-react'
import { notFound } from 'next/navigation'

import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { PriorityBadge } from '@/components/portal/priority-badge'
import { StatusBadge } from '@/components/portal/status-badge'
import { TicketReplyForm } from '@/components/portal/ticket-reply-form'
import { TicketStatusForm } from '@/components/portal/ticket-status-form'
import { TicketTimeline } from '@/components/portal/ticket-timeline'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { allowedTicketTransitions } from '@/lib/domain/ticket-workflow'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { findTicketForUser } from '@/server/repositories/portal'

export const metadata: Metadata = { title: 'Chi tiết ticket' }
const categoryLabels: Record<string, string> = {
  TECHNICAL: 'Kỹ thuật',
  ACCOUNT: 'Tài khoản',
  BILLING: 'Thanh toán',
  OTHER: 'Khác',
}
const slaDemo: Record<string, string> = {
  LOW: '2 ngày',
  MEDIUM: '1 ngày',
  HIGH: '8 giờ',
  URGENT: '4 giờ',
}

export default async function PortalTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requirePortalUser()
  const { id } = await params
  const ticket = await findTicketForUser(user, id)
  if (!ticket) notFound()
  const canReply = hasPermission(user, 'portal.tickets.reply')
  const canSupport = hasPermission(user, 'portal.tickets.manage')
  const staff = canSupport
    ? await db.user.findMany({
        where: { active: true, role: { name: { in: ['ADMIN', 'STAFF'] } } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : []
  const transitions = canSupport
    ? allowedTicketTransitions(user, ticket.status)
    : []

  return (
    <div className="portal-page ticket-detail">
      <PortalPageHeader
        eyebrow={ticket.code}
        title={ticket.subject}
        description={`Tạo bởi ${ticket.createdBy.name} lúc ${formatDateTime(ticket.createdAt)}`}
        actions={
          <>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </>
        }
      />
      <div className="ticket-detail__layout">
        <div className="ticket-detail__main">
          <section className="portal-panel ticket-summary">
            <header>
              <LifeBuoy size={19} />
              <div>
                <h2>Nội dung yêu cầu</h2>
                <span>{categoryLabels[ticket.category]}</span>
              </div>
            </header>
            <p>{ticket.description}</p>
          </section>
          <section className="portal-panel">
            <header className="portal-panel__header">
              <div>
                <h2>Lịch sử trao đổi</h2>
                <p>
                  {ticket.messages.length} cập nhật hiển thị theo quyền của bạn.
                </p>
              </div>
            </header>
            <TicketTimeline
              messages={ticket.messages.map((message) => ({
                ...message,
                author: { ...message.author, role: message.author.role.name },
              }))}
              currentUserId={user.id}
            />
          </section>
          <section className="portal-panel">
            <header className="portal-panel__header">
              <div>
                <h2>Gửi phản hồi</h2>
                <p>Phản hồi mới sẽ tạo thông báo cho bên liên quan.</p>
              </div>
            </header>
            {canReply ? (
              <TicketReplyForm
                ticketId={ticket.id}
                canUseInternal={canSupport}
              />
            ) : (
              <p className="portal-panel__empty">
                Bạn không có quyền gửi phản hồi cho ticket này.
              </p>
            )}
          </section>
        </div>
        <aside className="ticket-detail__aside">
          <section className="portal-panel">
            <h2>Điều phối ticket</h2>
            {canSupport ? (
              <TicketStatusForm
                ticketId={ticket.id}
                currentStatus={ticket.status}
                allowedStatuses={transitions}
                assignedToId={ticket.assignedTo?.id ?? null}
                staff={staff}
                canAssign={canSupport}
              />
            ) : (
              <p className="portal-panel__empty">
                Bạn không có quyền điều phối trạng thái hoặc phân công ticket.
              </p>
            )}
          </section>
          <section className="portal-panel ticket-facts">
            <h2>Thông tin</h2>
            <dl>
              <div>
                <dt>
                  <Building2 size={15} /> Tổ chức
                </dt>
                <dd>{ticket.organization.name}</dd>
              </div>
              <div>
                <dt>
                  <FolderKanban size={15} /> Dự án
                </dt>
                <dd>
                  {ticket.project ? (
                    <Link href={`/portal/projects/${ticket.project.id}`}>
                      {ticket.project.name}
                    </Link>
                  ) : (
                    'Không gắn dự án'
                  )}
                </dd>
              </div>
              <div>
                <dt>
                  <UserRound size={15} /> Người xử lý
                </dt>
                <dd>{ticket.assignedTo?.name ?? 'Chưa gán'}</dd>
              </div>
              <div>
                <dt>
                  <CalendarClock size={15} /> Cập nhật
                </dt>
                <dd>{formatDateTime(ticket.updatedAt)}</dd>
              </div>
              <div>
                <dt>SLA phản hồi</dt>
                <dd>
                  {slaDemo[ticket.priority]}{' '}
                  <small className="demo-label">dữ liệu demo</small>
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}
