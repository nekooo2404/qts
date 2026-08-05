'use client'

import { Check, CheckCheck, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'

export function NotificationActions({
  id,
  all = false,
}: {
  id?: string
  all?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  async function markRead() {
    setPending(true)
    await apiMutation(
      all
        ? '/api/portal/notifications/read-all'
        : `/api/portal/notifications/${id}/read`,
      'POST',
    )
    router.refresh()
    setPending(false)
  }
  return (
    <Button
      variant="ghost"
      size={all ? 'small' : 'icon'}
      onClick={markRead}
      disabled={pending}
      aria-label={all ? undefined : 'Đánh dấu đã đọc'}
    >
      {pending ? (
        <LoaderCircle className="is-spinning" size={16} />
      ) : all ? (
        <CheckCheck size={16} />
      ) : (
        <Check size={16} />
      )}
      {all && 'Đọc tất cả'}
    </Button>
  )
}
