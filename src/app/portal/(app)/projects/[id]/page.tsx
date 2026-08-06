import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectDetailSections } from '@/components/portal/project-detail-sections'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { findProjectForUser } from '@/server/repositories/portal'

export const metadata: Metadata = { title: 'Chi tiết dự án' }

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requirePortalUser()
  const { id } = await params
  const project = await findProjectForUser(user, id)
  if (!project) notFound()

  const canUpdateProjects = hasPermission(user, 'portal.projects.update')
  const canAssignAllProjects = hasPermission(user, 'portal.projects.assign.all')
  const canViewTasks = hasPermission(user, 'portal.tasks.read')
  const canViewDocuments = hasPermission(user, 'portal.documents.read')
  const canDownloadDocuments = hasPermission(user, 'portal.documents.download')
  const canViewTickets = hasPermission(user, 'portal.tickets.read')
  const organizations = canUpdateProjects
    ? await db.organization.findMany({
        where: canAssignAllProjects
          ? undefined
          : { id: user.organizationId ?? '__no_organization__' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : []

  return (
    <div className="portal-page project-detail">
      <ProjectDetailSections
        project={project}
        organizations={organizations}
        canDeleteProjects={hasPermission(user, 'portal.projects.delete')}
        canUpdateProjects={canUpdateProjects}
        canViewTasks={canViewTasks}
        canViewDocuments={canViewDocuments}
        canDownloadDocuments={canDownloadDocuments}
        canViewTickets={canViewTickets}
      />
    </div>
  )
}
