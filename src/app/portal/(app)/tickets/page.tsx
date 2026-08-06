import type { Metadata } from 'next'
import Link from 'next/link'
import { LifeBuoy, Plus, Search } from 'lucide-react'

import { DataTable } from '@/components/portal/data-table'
import { EmptyState } from '@/components/portal/empty-state'
import { Pagination } from '@/components/portal/pagination'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { PriorityBadge } from '@/components/portal/priority-badge'
import { StatusBadge } from '@/components/portal/status-badge'
import { TicketCreateForm } from '@/components/portal/ticket-create-form'
import { buttonVariants } from '@/components/ui/button'
import { statusLabels } from '@/config/portal'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { cn, formatDateTime } from '@/lib/utils'
import { projectScope, ticketScope } from '@/server/repositories/portal'

export const metadata: Metadata = { title: 'Ticket hỗ trợ' }
const ticketStatuses = [
  'NEW',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'RESOLVED',
  'CLOSED',
] as const
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
const pageSize = 10
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

export default async function PortalTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requirePortalUser()
  const canCreateTickets = hasPermission(user, 'portal.tickets.create')
  const raw = await searchParams
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 100) : ''
  const status =
    typeof raw.status === 'string' &&
    ticketStatuses.includes(raw.status as (typeof ticketStatuses)[number])
      ? raw.status
      : ''
  const priority =
    typeof raw.priority === 'string' &&
    priorities.includes(raw.priority as (typeof priorities)[number])
      ? raw.priority
      : ''
  const requestedPage = typeof raw.page === 'string' ? Number(raw.page) : 1
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const where = {
    AND: [
      ticketScope(user),
      q
        ? {
            OR: [
              { code: { contains: q } },
              { subject: { contains: q } },
              { organization: { name: { contains: q } } },
            ],
          }
        : {},
      status ? { status: status as (typeof ticketStatuses)[number] } : {},
      priority ? { priority: priority as (typeof priorities)[number] } : {},
    ],
  }
  const [count, tickets, projects] = await Promise.all([
    db.ticket.count({ where }),
    db.ticket.findMany({
      where,
      include: {
        organization: { select: { name: true } },
        project: { select: { name: true } },
        createdBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    canCreateTickets
      ? db.project.findMany({
          where: projectScope(user),
          select: { id: true, code: true, name: true },
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([]),
  ])
  const pageCount = Math.max(1, Math.ceil(count / pageSize))

  return (
    <div className="portal-page tickets-page">
      <PortalPageHeader
        eyebrow="Support desk"
        title="Ticket hỗ trợ"
        description="Tạo yêu cầu, theo dõi SLA demo và giữ toàn bộ lịch sử trao đổi trong một luồng."
        actions={
          canCreateTickets ? (
            <Link className={cn(buttonVariants())} href="#create-ticket">
              <Plus size={17} /> Tạo ticket
            </Link>
          ) : undefined
        }
      />
      <form className="portal-toolbar" method="get">
        <label className="portal-toolbar__search">
          <Search size={17} />
          <span className="sr-only">Tìm ticket</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Mã, tiêu đề hoặc tổ chức"
          />
        </label>
        <label>
          <span className="sr-only">Lọc trạng thái</span>
          <select name="status" defaultValue={status}>
            <option value="">Mọi trạng thái</option>
            {ticketStatuses.map((item) => (
              <option value={item} key={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc ưu tiên</span>
          <select name="priority" defaultValue={priority}>
            <option value="">Mọi mức ưu tiên</option>
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>
        </label>
        <button
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'small' }),
          )}
          type="submit"
        >
          Áp dụng
        </button>
      </form>
      {!tickets.length ? (
        <EmptyState
          title="Không tìm thấy ticket"
          description="Tạo yêu cầu mới hoặc thử thay đổi bộ lọc hiện tại."
          icon={LifeBuoy}
        />
      ) : (
        <DataTable
          label="Danh sách ticket"
          mobileCards={tickets.map((ticket) => (
            <Link
              className="data-mobile-card"
              href={`/portal/tickets/${ticket.id}`}
              key={ticket.id}
            >
              <span>
                {ticket.code} · {categoryLabels[ticket.category]}
              </span>
              <strong>{ticket.subject}</strong>
              <span>
                {ticket.organization.name} · {formatDateTime(ticket.updatedAt)}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </Link>
          ))}
        >
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Loại</th>
              <th>Tổ chức / dự án</th>
              <th>Người xử lý</th>
              <th>Ưu tiên</th>
              <th>Trạng thái</th>
              <th>SLA phản hồi</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link
                    className="table-primary"
                    href={`/portal/tickets/${ticket.id}`}
                  >
                    {ticket.subject}
                    <small>{ticket.code}</small>
                  </Link>
                </td>
                <td>{categoryLabels[ticket.category]}</td>
                <td>
                  {ticket.organization.name}
                  <small className="table-secondary">
                    {ticket.project?.name ?? 'Không gắn dự án'}
                  </small>
                </td>
                <td>{ticket.assignedTo?.name ?? 'Chưa gán'}</td>
                <td>
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td>
                  <StatusBadge status={ticket.status} />
                </td>
                <td>
                  {slaDemo[ticket.priority]}{' '}
                  <small className="demo-label">demo</small>
                </td>
                <td>{formatDateTime(ticket.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <Pagination
        basePath="/portal/tickets"
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        params={{ q, status, priority }}
      />
      {canCreateTickets && (
        <details
          className="portal-panel portal-create-panel"
          id="create-ticket"
        >
          <summary>
            <Plus size={18} /> Tạo ticket hỗ trợ
          </summary>
          <div className="portal-create-panel__body">
            <h2>Mô tả yêu cầu</h2>
            <p>
              Không đưa mật khẩu, token hoặc dữ liệu nhạy cảm vào nội dung
              ticket.
            </p>
            <TicketCreateForm projects={projects} />
          </div>
        </details>
      )}
    </div>
  )
}
