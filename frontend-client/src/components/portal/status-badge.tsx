import { Circle } from 'lucide-react'

import { statusLabels } from '@client/config/portal'
import { cn } from '@/lib/utils'

const positive = new Set([
  'ACTIVE',
  'COMPLETED',
  'DONE',
  'RESOLVED',
  'PAID',
  'PUBLISHED',
])
const warning = new Set([
  'PLANNING',
  'UPCOMING',
  'REVIEW',
  'WAITING_CUSTOMER',
  'SENT',
  'DRAFT',
])
const danger = new Set([
  'BLOCKED',
  'CANCELLED',
  'CLOSED',
  'OVERDUE',
  'EXPIRED',
  'TERMINATED',
])

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'status-badge',
        positive.has(status) && 'status-badge--success',
        warning.has(status) && 'status-badge--warning',
        danger.has(status) && 'status-badge--danger',
      )}
    >
      <Circle size={7} fill="currentColor" aria-hidden="true" />
      {statusLabels[status] ?? status}
    </span>
  )
}
