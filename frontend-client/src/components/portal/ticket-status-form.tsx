'use client'

import { useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { statusLabels } from '@client/config/portal'
import { apiMutation } from '@/lib/client/api'

export function TicketStatusForm({
  ticketId,
  currentStatus,
  allowedStatuses,
  assignedToId,
  staff,
  canAssign,
}: {
  ticketId: string
  currentStatus: string
  allowedStatuses: string[]
  assignedToId: string | null
  staff: { id: string; name: string }[]
  canAssign: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [assignee, setAssignee] = useState(assignedToId ?? '')
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)

  async function save() {
    setPending(true)
    setFeedback(null)
    const result = await apiMutation(
      `/api/portal/tickets/${ticketId}/status`,
      'PATCH',
      { status, ...(canAssign ? { assignedToId: assignee } : {}) },
    )
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) router.refresh()
    setPending(false)
  }

  return (
    <div className="ticket-status-form portal-form">
      <div className="field">
        <label htmlFor="ticket-next-status">Trạng thái</label>
        <select
          id="ticket-next-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value={currentStatus}>{statusLabels[currentStatus]}</option>
          {allowedStatuses.map((value) => (
            <option value={value} key={value}>
              {statusLabels[value]}
            </option>
          ))}
        </select>
      </div>
      {canAssign && (
        <div className="field">
          <label htmlFor="ticket-assignee">Người xử lý</label>
          <select
            id="ticket-assignee"
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
          >
            <option value="">Chưa gán</option>
            {staff.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <FormFeedback value={feedback} />
      <Button
        onClick={save}
        disabled={pending || (!allowedStatuses.length && !canAssign)}
      >
        {pending ? (
          <LoaderCircle className="is-spinning" size={17} />
        ) : (
          <RefreshCw size={17} />
        )}
        {pending ? 'Đang cập nhật...' : 'Cập nhật ticket'}
      </Button>
    </div>
  )
}
