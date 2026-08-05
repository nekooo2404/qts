import type { RoleName } from '@/lib/domain/permissions'

export type TicketStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED'

const supportTransitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_CUSTOMER', 'RESOLVED'],
  WAITING_CUSTOMER: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'NEW'],
  CLOSED: ['NEW'],
}

const customerTransitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: [],
  ACKNOWLEDGED: [],
  IN_PROGRESS: [],
  WAITING_CUSTOMER: [],
  RESOLVED: ['NEW'],
  CLOSED: [],
}

export function allowedTicketTransitions(role: RoleName, status: TicketStatus) {
  const transitions =
    role === 'CUSTOMER'
      ? customerTransitions[status]
      : supportTransitions[status]

  return [...transitions]
}

export function canTransitionTicket(
  role: RoleName,
  from: TicketStatus,
  to: TicketStatus,
) {
  if (from === to) {
    return false
  }

  return allowedTicketTransitions(role, from).includes(to)
}
