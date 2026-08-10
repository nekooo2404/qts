'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ProjectForm } from '@client/components/portal/project-form'

type OrganizationOption = { id: string; name: string }

export function ProjectCreateDialog({
  organizations,
}: {
  organizations: OrganizationOption[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <Plus size={17} aria-hidden /> Tạo dự án
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="project-create-dialog">
          <header className="project-create-dialog__header">
            <div>
              <span className="project-create-dialog__eyebrow">
                Delivery workspace
              </span>
              <Dialog.Title>Tạo dự án mới</Dialog.Title>
              <Dialog.Description>
                Tạo không gian làm việc, gắn tổ chức và thiết lập mốc bàn giao.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                className="project-create-dialog__close"
                variant="ghost"
                size="icon"
                aria-label="Đóng cửa sổ tạo dự án"
              >
                <X size={18} aria-hidden />
              </Button>
            </Dialog.Close>
          </header>
          <ProjectForm
            organizations={organizations}
            onSuccess={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
