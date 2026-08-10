'use client'

import { useState, type FormEvent } from 'react'
import { Check, LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'

export function UserAccessForm({
  id,
  role,
  active,
  isSelf = false,
  canChangeRole = true,
}: {
  id: string
  role: string
  active: boolean
  isSelf?: boolean
  canChangeRole?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextRole =
      isSelf || !canChangeRole ? role : String(formData.get('role'))
    const nextActive = isSelf ? active : formData.get('active') === 'on'
    setPending(true)
    try {
      const result = await apiMutation(
        `/api/portal/admin/users/${id}`,
        'PATCH',
        {
          role: nextRole,
          active: nextActive,
        },
      )
      setFeedback({
        type: result.ok ? 'success' : 'error',
        message: result.message,
      })
      if (result.ok) router.refresh()
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể cập nhật người dùng. Vui lòng thử lại.',
      })
    } finally {
      setPending(false)
    }
  }
  return (
    <form
      className="user-access-form"
      key={`${role}-${active}`}
      onSubmit={save}
    >
      <label>
        <span className="sr-only">Vai trò</span>
        <select
          name="role"
          defaultValue={role}
          disabled={isSelf || !canChangeRole}
        >
          <option value="ADMIN">ADMIN</option>
          <option value="STAFF">STAFF</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
      </label>
      <label
        className={`checkbox-field checkbox-field--custom compact-checkbox${
          isSelf ? ' is-disabled' : ''
        }`}
      >
        <input
          type="checkbox"
          name="active"
          defaultChecked={active}
          disabled={isSelf}
        />
        <span className="checkbox-field__box" aria-hidden="true">
          <Check size={13} strokeWidth={3} />
        </span>
        <span className="checkbox-field__copy">Hoạt động</span>
      </label>
      <Button
        variant="ghost"
        size="icon"
        type="submit"
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
    </form>
  )
}
