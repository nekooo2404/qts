'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { ConfirmationDialog } from '@client/components/portal/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { apiMutation } from '@/lib/client/api'

export function DeleteProjectButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const router = useRouter()
  return (
    <ConfirmationDialog
      trigger={
        <Button variant="danger">
          <Trash2 size={16} aria-hidden /> Xóa dự án
        </Button>
      }
      title="Xóa dự án?"
      description={`Dự án “${name}” cùng công việc và milestone liên quan sẽ bị xóa. Thao tác này không thể hoàn tác.`}
      onConfirm={async () => {
        const result = await apiMutation(`/api/portal/projects/${id}`, 'DELETE')
        if (result.ok) router.replace('/portal/projects')
        return result
      }}
    />
  )
}
