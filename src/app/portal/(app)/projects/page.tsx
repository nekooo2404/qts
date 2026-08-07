import type { Metadata } from 'next'
import Link from 'next/link'
import { Grid2X2, List, Plus, Search } from 'lucide-react'

import { DataTable } from '@client/components/portal/data-table'
import { EmptyState } from '@client/components/portal/empty-state'
import { Pagination } from '@client/components/portal/pagination'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'
import { PriorityBadge } from '@client/components/portal/priority-badge'
import { ProjectForm } from '@client/components/portal/project-form'
import { ProjectProgress } from '@client/components/portal/project-progress'
import { StatusBadge } from '@client/components/portal/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { cn, formatDate } from '@/lib/utils'
import { projectScope } from '@backend/server/repositories/portal'

export const metadata: Metadata = { title: 'Dự án' }
const statuses = new Set([
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
])
const pageSize = 8

export default async function PortalProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requirePortalUser()
  const canCreateProjects = hasPermission(user, 'portal.projects.create')
  const canAssignAllProjects = hasPermission(user, 'portal.projects.assign.all')
  const raw = await searchParams
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 100) : ''
  const status =
    typeof raw.status === 'string' && statuses.has(raw.status) ? raw.status : ''
  const view = raw.view === 'table' ? 'table' : 'grid'
  const sort =
    raw.sort === 'due'
      ? 'due'
      : raw.sort === 'progress'
        ? 'progress'
        : 'updated'
  const requestedPage = typeof raw.page === 'string' ? Number(raw.page) : 1
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const where = {
    AND: [
      projectScope(user),
      q
        ? {
            OR: [
              { name: { contains: q } },
              { code: { contains: q } },
              { organization: { name: { contains: q } } },
            ],
          }
        : {},
      status
        ? {
            status: status as
              'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
          }
        : {},
    ],
  }
  const orderBy =
    sort === 'due'
      ? { dueDate: 'asc' as const }
      : sort === 'progress'
        ? { progress: 'desc' as const }
        : { updatedAt: 'desc' as const }
  const [count, projects, organizations] = await Promise.all([
    db.project.count({ where }),
    db.project.findMany({
      where,
      include: {
        organization: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    canCreateProjects
      ? db.organization.findMany({
          where: canAssignAllProjects
            ? undefined
            : { id: user.organizationId ?? '__no_organization__' },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])
  const pageCount = Math.max(1, Math.ceil(count / pageSize))

  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Delivery workspace"
        title="Dự án"
        description="Theo dõi tiến độ, mốc bàn giao, thành viên và tài nguyên liên quan."
        actions={
          canCreateProjects ? (
            <Link className={cn(buttonVariants())} href="#create-project">
              <Plus size={17} aria-hidden /> Tạo dự án
            </Link>
          ) : undefined
        }
      />
      <form className="portal-toolbar" method="get">
        <label className="portal-toolbar__search">
          <Search size={17} aria-hidden />
          <span className="sr-only">Tìm dự án</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Tên, mã hoặc khách hàng"
          />
        </label>
        <label>
          <span className="sr-only">Lọc trạng thái</span>
          <select name="status" defaultValue={status}>
            <option value="">Mọi trạng thái</option>
            <option value="PLANNING">Lập kế hoạch</option>
            <option value="ACTIVE">Đang thực hiện</option>
            <option value="ON_HOLD">Tạm dừng</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sắp xếp</span>
          <select name="sort" defaultValue={sort}>
            <option value="updated">Cập nhật gần nhất</option>
            <option value="due">Ngày hoàn thành</option>
            <option value="progress">Tiến độ cao nhất</option>
          </select>
        </label>
        <input type="hidden" name="view" value={view} />
        <button
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'small' }),
          )}
          type="submit"
        >
          Áp dụng
        </button>
        <div className="view-switcher" aria-label="Kiểu hiển thị">
          <Link
            className={view === 'grid' ? 'is-active' : undefined}
            href={`/portal/projects?q=${encodeURIComponent(q)}&status=${status}&sort=${sort}&view=grid`}
            aria-label="Dạng lưới"
          >
            <Grid2X2 size={16} />
          </Link>
          <Link
            className={view === 'table' ? 'is-active' : undefined}
            href={`/portal/projects?q=${encodeURIComponent(q)}&status=${status}&sort=${sort}&view=table`}
            aria-label="Dạng bảng"
          >
            <List size={16} />
          </Link>
        </div>
      </form>

      {!projects.length ? (
        <EmptyState
          title="Không tìm thấy dự án"
          description="Thử đổi từ khóa hoặc bộ lọc. Dữ liệu chỉ hiển thị trong phạm vi vai trò của bạn."
        />
      ) : view === 'grid' ? (
        <div className="project-grid">
          {projects.map((project) => (
            <Link
              className="project-card"
              href={`/portal/projects/${project.id}`}
              key={project.id}
            >
              <header>
                <div>
                  <span>{project.code}</span>
                  <h2>{project.name}</h2>
                </div>
                <StatusBadge status={project.status} />
              </header>
              <p>{project.description}</p>
              <dl>
                <div>
                  <dt>Khách hàng</dt>
                  <dd>{project.organization.name}</dd>
                </div>
                <div>
                  <dt>Quản lý</dt>
                  <dd>{project.createdBy.name}</dd>
                </div>
                <div>
                  <dt>Hoàn thành dự kiến</dt>
                  <dd>{formatDate(project.dueDate)}</dd>
                </div>
                <div>
                  <dt>Ưu tiên</dt>
                  <dd>
                    <PriorityBadge priority={project.priority} />
                  </dd>
                </div>
              </dl>
              <ProjectProgress value={project.progress} />
            </Link>
          ))}
        </div>
      ) : (
        <DataTable
          label="Danh sách dự án"
          mobileCards={projects.map((project) => (
            <Link
              className="data-mobile-card"
              href={`/portal/projects/${project.id}`}
              key={project.id}
            >
              <strong>{project.name}</strong>
              <span>
                {project.code} · {project.organization.name}
              </span>
              <StatusBadge status={project.status} />
              <ProjectProgress value={project.progress} />
            </Link>
          ))}
        >
          <thead>
            <tr>
              <th>Dự án</th>
              <th>Khách hàng</th>
              <th>Quản lý</th>
              <th>Hoàn thành</th>
              <th>Trạng thái</th>
              <th>Ưu tiên</th>
              <th>Tiến độ</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>
                  <Link
                    className="table-primary"
                    href={`/portal/projects/${project.id}`}
                  >
                    {project.name}
                    <small>{project.code}</small>
                  </Link>
                </td>
                <td>{project.organization.name}</td>
                <td>{project.createdBy.name}</td>
                <td>{formatDate(project.dueDate)}</td>
                <td>
                  <StatusBadge status={project.status} />
                </td>
                <td>
                  <PriorityBadge priority={project.priority} />
                </td>
                <td>
                  <ProjectProgress
                    value={project.progress}
                    label={`Tiến độ ${project.name}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <Pagination
        basePath="/portal/projects"
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        params={{ q, status, sort, view }}
      />
      {canCreateProjects && (
        <details
          className="portal-panel portal-create-panel"
          id="create-project"
        >
          <summary>
            <Plus size={18} aria-hidden /> Tạo dự án mới
          </summary>
          <div className="portal-create-panel__body">
            <h2>Thông tin dự án</h2>
            <p>Dự án do STAFF tạo sẽ tự gắn người tạo làm quản lý dự án.</p>
            <ProjectForm organizations={organizations} />
          </div>
        </details>
      )}
    </div>
  )
}
