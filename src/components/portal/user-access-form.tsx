'use client'

import { useState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/portal/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'

export function UserAccessForm({
  id,
  role,
  active,
}: {
  id: string
  role: string
  active: boolean
}) {
  const router = useRouter()
  const [nextRole, setNextRole] = useState(role)
  const [nextActive, setNextActive] = useState(active)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save() {
    setPending(true)
    const result = await apiMutation(`/api/portal/admin/users/${id}`, 'PATCH', {
      role: nextRole,
      active: nextActive,
    })
    setFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    })
    if (result.ok) router.refresh()
    setPending(false)
  }
  return (
    <div className="user-access-form">
      <label>
        <span className="sr-only">Vai trò</span>
        <select
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value)}
        >
          <option value="ADMIN">ADMIN</option>
          <option value="STAFF">STAFF</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
      </label>
      <label className="compact-checkbox">
        <input
          type="checkbox"
          checked={nextActive}
          onChange={(event) => setNextActive(event.target.checked)}
        />{' '}
        Hoạt động
      </label>
      <Button
        variant="ghost"
        size="icon"
        onClick={save}
        disabled={pending}
        aria-label="Lưu quyền người dùng"
      >
        {pending ? (
          <LoaderCircle className="is-spinning" size={16} />
        ) : (
          <Save size={16} />
        )}
      </Button>
      <FormFeedback value={feedback} />
    </div>
  )
}
