import { Flag } from 'lucide-react'

import { priorityLabels } from '@client/config/portal'
import { cn } from '@/lib/utils'

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        'priority-badge',
        `priority-badge--${priority.toLowerCase()}`,
      )}
    >
      <Flag size={13} aria-hidden="true" />{' '}
      {priorityLabels[priority] ?? priority}
    </span>
  )
}
