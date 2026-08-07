import type { Metadata } from 'next'
import Link from 'next/link'
import {
  KanbanSquare,
  List,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
} from 'lucide-react'

import { DataTable } from '@client/components/portal/data-table'
import { EmptyState } from '@client/components/portal/empty-state'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'
import { PriorityBadge } from '@client/components/portal/priority-badge'
import { ProjectProgress } from '@client/components/portal/project-progress'
import { StatusBadge } from '@client/components/portal/status-badge'
import { TaskForm } from '@client/components/portal/task-form'
import { TaskUpdateForm } from '@client/components/portal/task-update-form'
import { buttonVariants } from '@/components/ui/button'
import { statusLabels } from '@client/config/portal'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { cn, formatDate } from '@/lib/utils'
import { projectScope, taskScope } from '@/server/repositories/portal'

export const metadata: Metadata = { title: 'Công việc' }
const taskStatuses = [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'DONE',
] as const

export default async function PortalTasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requirePortalUser()
  const raw = await searchParams
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 100) : ''
  const status =
    typeof raw.status === 'string' &&
    taskStatuses.includes(raw.status as (typeof taskStatuses)[number])
      ? raw.status
      : ''
  const view = raw.view === 'list' ? 'list' : 'kanban'
  const canCreateTasks = hasPermission(user, 'portal.tasks.create')
  const canUpdateTasks = hasPermission(user, 'portal.tasks.update')
  const where = {
    AND: [
      taskScope(user),
      q
        ? {
            OR: [
              { title: { contains: q } },
              {
                project: {
                  OR: [{ name: { contains: q } }, { code: { contains: q } }],
                },
              },
            ],
          }
        : {},
      status ? { status: status as (typeof taskStatuses)[number] } : {},
    ],
  }
  const [tasks, projects] = await Promise.all([
    db.task.findMany({
      where,
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
    }),
    canCreateTasks
      ? db.project.findMany({
          where: projectScope(user),
          select: {
            id: true,
            name: true,
            members: { select: { user: { select: { id: true, name: true } } } },
            milestones: { select: { id: true, name: true } },
          },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="portal-page tasks-page">
      <PortalPageHeader
        eyebrow="Execution board"
        title="Công việc"
        description="Quan sát luồng thực hiện, deadline và mức hoàn thành trong một bề mặt làm việc."
        actions={
          canCreateTasks ? (
            <Link className={cn(buttonVariants())} href="#create-task">
              <Plus size={17} /> Tạo công việc
            </Link>
          ) : undefined
        }
      />
      <form className="portal-toolbar" method="get">
        <label className="portal-toolbar__search">
          <Search size={17} />
          <span className="sr-only">Tìm công việc</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Tên công việc hoặc dự án"
          />
        </label>
        <label>
          <span className="sr-only">Lọc trạng thái</span>
          <select name="status" defaultValue={status}>
            <option value="">Mọi trạng thái</option>
            {taskStatuses.map((item) => (
              <option value={item} key={item}>
                {statusLabels[item]}
              </option>
            ))}
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
            className={view === 'kanban' ? 'is-active' : undefined}
            href={`/portal/tasks?q=${encodeURIComponent(q)}&status=${status}&view=kanban`}
            aria-label="Kanban"
          >
            <KanbanSquare size={16} />
          </Link>
          <Link
            className={view === 'list' ? 'is-active' : undefined}
            href={`/portal/tasks?q=${encodeURIComponent(q)}&status=${status}&view=list`}
            aria-label="Danh sách"
          >
            <List size={16} />
          </Link>
        </div>
      </form>

      {!tasks.length ? (
        <EmptyState
          title="Không tìm thấy công việc"
          description="Thử đổi từ khóa hoặc bộ lọc. CUSTOMER chỉ nhìn thấy công việc thuộc dự án của tổ chức mình."
        />
      ) : view === 'kanban' ? (
        <div className="kanban-board">
          {taskStatuses.map((column) => {
            const items = tasks.filter((task) => task.status === column)
            return (
              <section className="kanban-column" key={column}>
                <header>
                  <span>{statusLabels[column]}</span>
                  <strong>{items.length}</strong>
                </header>
                <div>
                  {items.length ? (
                    items.map((task) => (
                      <article className="task-card" key={task.id}>
                        <div className="task-card__meta">
                          <PriorityBadge priority={task.priority} />
                          <span>{task.project.code}</span>
                        </div>
                        <h2>{task.title}</h2>
                        <p>{task.description ?? 'Chưa có mô tả.'}</p>
                        <Link href={`/portal/projects/${task.project.id}`}>
                          {task.project.name}
                        </Link>
                        <ProjectProgress
                          value={task.progress}
                          label={`Tiến độ ${task.title}`}
                        />
                        <footer>
                          <span>{task.assignee?.name ?? 'Chưa phân công'}</span>
                          <time>{formatDate(task.dueDate)}</time>
                        </footer>
                        <div className="task-card__signals">
                          <span>
                            <MessageSquareText size={14} />{' '}
                            {task._count.comments}
                          </span>
                          <span>
                            <Paperclip size={14} /> Tệp demo
                          </span>
                        </div>
                        {canUpdateTasks && (
                          <TaskUpdateForm
                            id={task.id}
                            status={task.status}
                            progress={task.progress}
                          />
                        )}
                      </article>
                    ))
                  ) : (
                    <p>Không có công việc</p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <DataTable
          label="Danh sách công việc"
          mobileCards={tasks.map((task) => (
            <article className="data-mobile-card" key={task.id}>
              <strong>{task.title}</strong>
              <span>
                {task.project.name} · {task.assignee?.name ?? 'Chưa phân công'}
              </span>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {canUpdateTasks && (
                <TaskUpdateForm
                  id={task.id}
                  status={task.status}
                  progress={task.progress}
                />
              )}
            </article>
          ))}
        >
          <thead>
            <tr>
              <th>Công việc</th>
              <th>Dự án</th>
              <th>Phụ trách</th>
              <th>Deadline</th>
              <th>Ưu tiên</th>
              <th>Trạng thái</th>
              <th>Tiến độ</th>
              {canUpdateTasks && <th>Cập nhật</th>}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="table-primary">{task.title}</td>
                <td>
                  <Link href={`/portal/projects/${task.project.id}`}>
                    {task.project.name}
                  </Link>
                </td>
                <td>{task.assignee?.name ?? 'Chưa phân công'}</td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>
                  <ProjectProgress value={task.progress} />
                </td>
                {canUpdateTasks && (
                  <td>
                    <TaskUpdateForm
                      id={task.id}
                      status={task.status}
                      progress={task.progress}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      {canCreateTasks && (
        <details className="portal-panel portal-create-panel" id="create-task">
          <summary>
            <Plus size={18} /> Tạo công việc mới
          </summary>
          <div className="portal-create-panel__body">
            <h2>Phạm vi công việc</h2>
            <p>Người phụ trách và milestone phải thuộc dự án đã chọn.</p>
            <TaskForm projects={projects} />
          </div>
        </details>
      )}
    </div>
  )
}
