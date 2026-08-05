import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import type { AuthUser } from '@/lib/auth/session'
import { db } from '@/lib/db'

const impossibleOrganizationId = '__no_organization__'

export function projectScope(user: AuthUser): Prisma.ProjectWhereInput {
  if (user.role === 'ADMIN') return {}
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
  if (user.role === 'ADMIN') return {}
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
  if (user.role === 'ADMIN' || user.role === 'STAFF') return {}
  return { organizationId: user.organizationId ?? impossibleOrganizationId }
}

export function organizationScope(
  user: AuthUser,
): Prisma.OrganizationWhereInput {
  if (user.role === 'ADMIN' || user.role === 'STAFF') return {}
  return { id: user.organizationId ?? impossibleOrganizationId }
}

export function resourceOrganizationFilter(user: AuthUser) {
  return user.role === 'CUSTOMER'
    ? { organizationId: user.organizationId ?? impossibleOrganizationId }
    : {}
}

export async function getDashboardData(user: AuthUser) {
  const now = new Date()
  const dueSoon = new Date(now)
  dueSoon.setDate(dueSoon.getDate() + 14)

  const projectsWhere = projectScope(user)
  const tasksWhere = taskScope(user)
  const ticketsWhere = ticketScope(user)
  const resourcesWhere = resourceOrganizationFilter(user)

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
    db.project.count({
      where: { AND: [projectsWhere, { status: 'ACTIVE' }] },
    }),
    db.task.count({
      where: {
        AND: [
          tasksWhere,
          { dueDate: { gte: now, lte: dueSoon }, status: { not: 'DONE' } },
        ],
      },
    }),
    db.ticket.count({
      where: {
        AND: [ticketsWhere, { status: { notIn: ['RESOLVED', 'CLOSED'] } }],
      },
    }),
    db.document.count({
      where: {
        ...resourcesWhere,
        createdAt: { gte: new Date(now.getTime() - 30 * 86400000) },
      },
    }),
    db.contract.count({ where: { ...resourcesWhere, status: 'ACTIVE' } }),
    db.project.findMany({
      where: projectsWhere,
      include: {
        organization: { select: { name: true } },
        tasks: { select: { status: true, progress: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    db.task.groupBy({
      by: ['status'],
      where: tasksWhere,
      _count: { _all: true },
    }),
    db.ticket.groupBy({
      by: ['priority'],
      where: ticketsWhere,
      _count: { _all: true },
    }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    db.announcement.findMany({
      where: {
        active: true,
        OR: [
          { audience: 'ALL' },
          { audience: user.role === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF' },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
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
        include: { assignee: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
      },
      documents: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      tickets: { orderBy: { updatedAt: 'desc' }, take: 5 },
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
        where: user.role === 'CUSTOMER' ? { internal: false } : {},
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
