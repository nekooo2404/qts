import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import type { AuthUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'

const impossibleOrganizationId = '__no_organization__'

export function projectScope(user: AuthUser): Prisma.ProjectWhereInput {
  if (!hasPermission(user, 'portal.projects.read')) {
    return { id: '__no_project_access__' }
  }
  if (hasPermission(user, 'portal.projects.read.all')) return {}
  if (user.role === 'STAFF') {
    return {
      OR: [
        { createdById: user.id },
        { members: { some: { userId: user.id } } },
      ],
    }
  }
  return { organizationId: user.organizationId ?? impossibleOrganizationId }
}

export function taskScope(user: AuthUser): Prisma.TaskWhereInput {
  if (!hasPermission(user, 'portal.tasks.read')) {
    return { id: '__no_task_access__' }
  }
  if (hasPermission(user, 'portal.tasks.read.all')) return {}
  if (user.role === 'STAFF') {
    return {
      OR: [
        { assigneeId: user.id },
        { createdById: user.id },
        { project: { members: { some: { userId: user.id } } } },
      ],
    }
  }
  return {
    project: {
      organizationId: user.organizationId ?? impossibleOrganizationId,
    },
  }
}

export function ticketScope(user: AuthUser): Prisma.TicketWhereInput {
  if (!hasPermission(user, 'portal.tickets.read')) {
    return { id: '__no_ticket_access__' }
  }
  if (hasPermission(user, 'portal.tickets.read.all')) return {}
  return { organizationId: user.organizationId ?? impossibleOrganizationId }
}

export function organizationScope(
  user: AuthUser,
): Prisma.OrganizationWhereInput {
  if (hasPermission(user, 'portal.projects.read.all')) return {}
  return { id: user.organizationId ?? impossibleOrganizationId }
}

export type ResourceKind = 'documents' | 'contracts' | 'invoices'

export function resourceOrganizationFilter(
  user: AuthUser,
  resource: ResourceKind,
) {
  const readAllPermission = {
    documents: 'portal.documents.read.all',
    contracts: 'portal.contracts.read.all',
    invoices: 'portal.invoices.read.all',
  }[resource]
  if (hasPermission(user, readAllPermission)) return {}
  return { organizationId: user.organizationId ?? impossibleOrganizationId }
}

export async function getDashboardData(user: AuthUser) {
  const now = new Date()
  const dueSoon = new Date(now)
  dueSoon.setDate(dueSoon.getDate() + 14)

  const canViewProjects = hasPermission(user, 'portal.projects.read')
  const canViewTasks = hasPermission(user, 'portal.tasks.read')
  const canViewTickets = hasPermission(user, 'portal.tickets.read')
  const canViewDocuments = hasPermission(user, 'portal.documents.read')
  const canViewContracts = hasPermission(user, 'portal.contracts.read')
  const canViewNotifications = hasPermission(user, 'portal.notifications.read')
  const canViewAnnouncements = hasPermission(user, 'portal.announcements.read')
  const projectsWhere = projectScope(user)
  const tasksWhere = taskScope(user)
  const ticketsWhere = ticketScope(user)
  const [
    activeProjects,
    tasksDueSoon,
    openTickets,
    recentDocuments,
    activeContracts,
    projects,
    tasksByStatus,
    ticketsByPriority,
    notifications,
    announcements,
  ] = await Promise.all([
    canViewProjects
      ? db.project.count({
          where: { AND: [projectsWhere, { status: 'ACTIVE' }] },
        })
      : Promise.resolve(0),
    canViewTasks
      ? db.task.count({
          where: {
            AND: [
              tasksWhere,
              { dueDate: { gte: now, lte: dueSoon }, status: { not: 'DONE' } },
            ],
          },
        })
      : Promise.resolve(0),
    canViewTickets
      ? db.ticket.count({
          where: {
            AND: [ticketsWhere, { status: { notIn: ['RESOLVED', 'CLOSED'] } }],
          },
        })
      : Promise.resolve(0),
    canViewDocuments
      ? db.document.count({
          where: {
            ...resourceOrganizationFilter(user, 'documents'),
            createdAt: { gte: new Date(now.getTime() - 30 * 86400000) },
          },
        })
      : Promise.resolve(0),
    canViewContracts
      ? db.contract.count({
          where: {
            ...resourceOrganizationFilter(user, 'contracts'),
            status: 'ACTIVE',
          },
        })
      : Promise.resolve(0),
    canViewProjects
      ? db.project.findMany({
          where: projectsWhere,
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            progress: true,
            dueDate: true,
            organization: { select: { name: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        })
      : Promise.resolve([]),
    canViewTasks
      ? db.task.groupBy({
          by: ['status'],
          where: tasksWhere,
          _count: { _all: true },
        })
      : Promise.resolve([]),
    canViewTickets
      ? db.ticket.groupBy({
          by: ['priority'],
          where: ticketsWhere,
          _count: { _all: true },
        })
      : Promise.resolve([]),
    canViewNotifications
      ? db.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 6,
        })
      : Promise.resolve([]),
    canViewAnnouncements
      ? db.announcement.findMany({
          where: {
            active: true,
            OR: [
              { audience: 'ALL' },
              { audience: user.role === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF' },
            ],
          },
          orderBy: { publishedAt: 'desc' },
          take: 3,
        })
      : Promise.resolve([]),
  ])

  return {
    metrics: {
      activeProjects,
      tasksDueSoon,
      openTickets,
      recentDocuments,
      activeContracts,
    },
    projects,
    taskChart: tasksByStatus.map((item) => ({
      status: item.status,
      value: item._count._all,
    })),
    ticketChart: ticketsByPriority.map((item) => ({
      priority: item.priority,
      value: item._count._all,
    })),
    notifications,
    announcements,
    capabilities: {
      projects: canViewProjects,
      tasks: canViewTasks,
      tickets: canViewTickets,
      documents: canViewDocuments,
      contracts: canViewContracts,
      notifications: canViewNotifications,
      announcements: canViewAnnouncements,
    },
  }
}

export async function findProjectForUser(user: AuthUser, id: string) {
  return db.project.findFirst({
    where: { AND: [projectScope(user), { id }] },
    include: {
      organization: true,
      createdBy: { select: { id: true, name: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              title: true,
              role: { select: { name: true } },
            },
          },
        },
      },
      milestones: { orderBy: { dueDate: 'asc' } },
      tasks: {
        where: taskScope(user),
        include: { assignee: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
      },
      documents: {
        where: resourceOrganizationFilter(user, 'documents'),
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      tickets: {
        where: ticketScope(user),
        orderBy: { updatedAt: 'desc' },
        take: 5,
      },
    },
  })
}

export async function findTicketForUser(user: AuthUser, id: string) {
  return db.ticket.findFirst({
    where: { AND: [ticketScope(user), { id }] },
    include: {
      organization: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      createdBy: {
        select: { id: true, name: true, role: { select: { name: true } } },
      },
      assignedTo: { select: { id: true, name: true } },
      messages: {
        where: hasPermission(user, 'portal.tickets.manage')
          ? {}
          : { internal: false },
        include: {
          author: {
            select: { id: true, name: true, role: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}
