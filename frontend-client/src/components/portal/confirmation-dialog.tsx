'use client'

import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { LoaderCircle, Trash2, X } from 'lucide-react'

import {
  FormFeedback,
  type FormFeedbackValue,
} from '@client/components/portal/form-feedback'
import { Button } from '@/components/ui/button'

type ConfirmationDialogProps = {
  trigger: ReactNode
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<{ ok: boolean; message: string }>
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Xác nhận xóa',
  onConfirm,
}: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)

  async function confirm() {
    setPending(true)
    setFeedback(null)
    try {
      const result = await onConfirm()
      if (!result.ok) {
        setFeedback({ type: 'error', message: result.message })
        return
      }
      setOpen(false)
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể hoàn tất thao tác lúc này.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setFeedback(null)
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="confirmation-dialog">
          <div className="confirmation-dialog__icon">
            <Trash2 size={20} aria-hidden />
          </div>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <FormFeedback value={feedback} />
          <div className="confirmation-dialog__actions">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={pending}>
                Hủy
              </Button>
            </Dialog.Close>
            <Button variant="danger" onClick={confirm} disabled={pending}>
              {pending && (
                <LoaderCircle className="is-spinning" size={17} aria-hidden />
              )}
              {pending ? 'Đang xử lý...' : confirmLabel}
            </Button>
          </div>
          <Dialog.Close asChild>
            <Button
              className="confirmation-dialog__close"
              variant="ghost"
              size="icon"
              aria-label="Đóng"
            >
              <X size={18} />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
