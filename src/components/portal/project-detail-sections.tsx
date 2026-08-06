import Link from 'next/link'
import {
  CalendarDays,
  FileText,
  Flag,
  LifeBuoy,
  UsersRound,
} from 'lucide-react'

import { DataTable } from '@/components/portal/data-table'
import { DeleteProjectButton } from '@/components/portal/delete-project-button'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { PriorityBadge } from '@/components/portal/priority-badge'
import { ProjectForm } from '@/components/portal/project-form'
import { ProjectProgress } from '@/components/portal/project-progress'
import { StatusBadge } from '@/components/portal/status-badge'
import { formatDate, formatDateInput, formatFileSize } from '@/lib/utils'
import type { findProjectForUser } from '@/server/repositories/portal'

type Project = NonNullable<Awaited<ReturnType<typeof findProjectForUser>>>

type ProjectDetailSectionsProps = {
  project: Project
  organizations: Array<{ id: string; name: string }>
  canDeleteProjects: boolean
  canUpdateProjects: boolean
  canViewTasks: boolean
  canViewDocuments: boolean
  canDownloadDocuments: boolean
  canViewTickets: boolean
}

export function ProjectDetailSections({
  project,
  organizations,
  canDeleteProjects,
  canUpdateProjects,
  canViewTasks,
  canViewDocuments,
  canDownloadDocuments,
  canViewTickets,
}: ProjectDetailSectionsProps) {
  return (
    <>
      <ProjectDetailHeader
        project={project}
        canDeleteProjects={canDeleteProjects}
      />
      <ProjectDetailNavigation
        canViewTasks={canViewTasks}
        canViewDocuments={canViewDocuments}
      />
      <ProjectOverview project={project} canViewTasks={canViewTasks} />
      <ProjectMilestones project={project} />
      {canViewTasks && <ProjectTasks project={project} />}
      <div className="detail-two-columns">
        <ProjectMembers project={project} />
        {canViewDocuments && (
          <ProjectDocuments
            project={project}
            canDownloadDocuments={canDownloadDocuments}
          />
        )}
      </div>
      <ProjectActivity project={project} canViewTickets={canViewTickets} />
      {canUpdateProjects && (
        <ProjectEditPanel project={project} organizations={organizations} />
      )}
    </>
  )
}

function ProjectDetailHeader({
  project,
  canDeleteProjects,
}: Pick<ProjectDetailSectionsProps, 'project' | 'canDeleteProjects'>) {
  return (
    <PortalPageHeader
      eyebrow={project.code}
      title={project.name}
      description={project.description}
      actions={
        <>
          <StatusBadge status={project.status} />
          {canDeleteProjects && (
            <DeleteProjectButton id={project.id} name={project.name} />
          )}
        </>
      }
    />
  )
}

function ProjectDetailNavigation({
  canViewTasks,
  canViewDocuments,
}: Pick<ProjectDetailSectionsProps, 'canViewTasks' | 'canViewDocuments'>) {
  return (
    <nav className="detail-tabs" aria-label="Nội dung dự án">
      <a href="#overview">Tổng quan</a>
      <a href="#milestones">Milestone</a>
      {canViewTasks && <a href="#tasks">Công việc</a>}
      <a href="#members">Thành viên</a>
      {canViewDocuments && <a href="#documents">Tài liệu</a>}
      <a href="#activity">Hoạt động</a>
    </nav>
  )
}

function ProjectOverview({
  project,
  canViewTasks,
}: Pick<ProjectDetailSectionsProps, 'project' | 'canViewTasks'>) {
  const completedTaskCount = project.tasks.filter(
    (task) => task.status === 'DONE',
  ).length

  return (
    <section className="portal-panel project-overview" id="overview">
      <div className="project-overview__main">
        <header>
          <h2>Tổng quan thực hiện</h2>
          <PriorityBadge priority={project.priority} />
        </header>
        <ProjectProgress value={project.progress} />
        <dl className="detail-definition-grid">
          <div>
            <dt>Khách hàng</dt>
            <dd>{project.organization.name}</dd>
          </div>
          <div>
            <dt>Quản lý dự án</dt>
            <dd>{project.createdBy.name}</dd>
          </div>
          <div>
            <dt>Ngày bắt đầu</dt>
            <dd>{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt>Hoàn thành dự kiến</dt>
            <dd>{formatDate(project.dueDate)}</dd>
          </div>
        </dl>
      </div>
      {canViewTasks && (
        <aside>
          <CalendarDays size={20} aria-hidden />
          <strong>
            {completedTaskCount}/{project.tasks.length}
          </strong>
          <span>Công việc hoàn tất</span>
        </aside>
      )}
    </section>
  )
}

function ProjectMilestones({
  project,
}: Pick<ProjectDetailSectionsProps, 'project'>) {
  return (
    <section className="portal-panel" id="milestones">
      <header className="portal-panel__header">
        <div>
          <h2>Milestone</h2>
          <p>Các mốc bàn giao và mức hoàn thành.</p>
        </div>
        <Flag size={18} aria-hidden />
      </header>
      {project.milestones.length ? (
        <ol className="milestone-list">
          {project.milestones.map((item) => (
            <li key={item.id}>
              <span />
              <div>
                <header>
                  <strong>{item.name}</strong>
                  <StatusBadge status={item.status} />
                </header>
                <p>{item.description}</p>
                <small>Hạn: {formatDate(item.dueDate)}</small>
                <ProjectProgress value={item.progress} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="portal-panel__empty">Chưa có milestone.</p>
      )}
    </section>
  )
}

function ProjectTasks({
  project,
}: Pick<ProjectDetailSectionsProps, 'project'>) {
  return (
    <section className="portal-panel" id="tasks">
      <header className="portal-panel__header">
        <div>
          <h2>Công việc</h2>
          <p>Phạm vi thực hiện trong dự án.</p>
        </div>
        <Link href={`/portal/tasks?q=${encodeURIComponent(project.code)}`}>
          Mở module công việc
        </Link>
      </header>
      {project.tasks.length ? (
        <DataTable
          label="Công việc dự án"
          mobileCards={project.tasks.map((task) => (
            <article className="data-mobile-card" key={task.id}>
              <strong>{task.title}</strong>
              <span>
                {task.assignee?.name ?? 'Chưa phân công'} ·{' '}
                {formatDate(task.dueDate)}
              </span>
              <StatusBadge status={task.status} />
              <ProjectProgress value={task.progress} />
            </article>
          ))}
        >
          <thead>
            <tr>
              <th>Công việc</th>
              <th>Người phụ trách</th>
              <th>Deadline</th>
              <th>Trạng thái</th>
              <th>Tiến độ</th>
            </tr>
          </thead>
          <tbody>
            {project.tasks.map((task) => (
              <tr key={task.id}>
                <td className="table-primary">{task.title}</td>
                <td>{task.assignee?.name ?? 'Chưa phân công'}</td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>
                  <ProjectProgress value={task.progress} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <p className="portal-panel__empty">Chưa có công việc.</p>
      )}
    </section>
  )
}

function ProjectMembers({
  project,
}: Pick<ProjectDetailSectionsProps, 'project'>) {
  return (
    <section className="portal-panel" id="members">
      <header className="portal-panel__header">
        <div>
          <h2>Thành viên</h2>
          <p>Nhân sự tham gia dự án.</p>
        </div>
        <UsersRound size={18} aria-hidden />
      </header>
      <div className="member-list">
        {project.members.map(({ user: member, title }) => (
          <article key={member.id}>
            <span>{member.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{member.name}</strong>
              <small>
                {title} · {member.title ?? member.role.name}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectDocuments({
  project,
  canDownloadDocuments,
}: Pick<ProjectDetailSectionsProps, 'project' | 'canDownloadDocuments'>) {
  return (
    <section className="portal-panel" id="documents">
      <header className="portal-panel__header">
        <div>
          <h2>Tài liệu gần đây</h2>
          <p>Tài nguyên được chia sẻ trong dự án.</p>
        </div>
        <FileText size={18} aria-hidden />
      </header>
      <div className="resource-list">
        {project.documents.map((document) => {
          const content = (
            <>
              <FileText size={17} />
              <span>
                <strong>{document.name}</strong>
                <small>
                  {formatFileSize(document.size)} · {document.uploadedBy.name}
                </small>
              </span>
            </>
          )
          return canDownloadDocuments ? (
            <a
              href={`/api/portal/documents/${document.id}/download`}
              key={document.id}
            >
              {content}
            </a>
          ) : (
            <article key={document.id}>{content}</article>
          )
        })}
      </div>
    </section>
  )
}

function ProjectActivity({
  project,
  canViewTickets,
}: Pick<ProjectDetailSectionsProps, 'project' | 'canViewTickets'>) {
  return (
    <section className="portal-panel" id="activity">
      <header className="portal-panel__header">
        <div>
          <h2>Timeline hoạt động</h2>
          <p>Các dấu mốc chính trong dữ liệu dự án.</p>
        </div>
      </header>
      <ol className="activity-timeline">
        <li>
          <span />
          <div>
            <strong>Dự án được khởi tạo</strong>
            <small>
              {formatDate(project.createdAt)} · {project.createdBy.name}
            </small>
          </div>
        </li>
        {project.milestones.map((item) => (
          <li key={item.id}>
            <span />
            <div>
              <strong>Milestone: {item.name}</strong>
              <small>
                {formatDate(item.dueDate)} · {item.progress}% hoàn thành
              </small>
            </div>
          </li>
        ))}
        {canViewTickets &&
          project.tickets.map((ticket) => (
            <li key={ticket.id}>
              <span />
              <div>
                <Link href={`/portal/tickets/${ticket.id}`}>
                  <LifeBuoy size={14} /> {ticket.code}: {ticket.subject}
                </Link>
                <small>Cập nhật {formatDate(ticket.updatedAt)}</small>
              </div>
            </li>
          ))}
      </ol>
    </section>
  )
}

function ProjectEditPanel({
  project,
  organizations,
}: Pick<ProjectDetailSectionsProps, 'project' | 'organizations'>) {
  return (
    <details className="portal-panel portal-create-panel">
      <summary>Chỉnh sửa thông tin dự án</summary>
      <div className="portal-create-panel__body">
        <ProjectForm
          projectId={project.id}
          organizations={organizations}
          defaultValues={{
            code: project.code,
            name: project.name,
            description: project.description,
            organizationId: project.organizationId,
            status: project.status,
            priority: project.priority,
            progress: project.progress,
            startDate: formatDateInput(project.startDate),
            dueDate: formatDateInput(project.dueDate),
          }}
        />
      </div>
    </details>
  )
}
