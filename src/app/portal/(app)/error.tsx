'use client'

import { ErrorState } from '@/components/shared/error-state'

export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      code="500"
      title="Không thể tải dữ liệu portal"
      description="Kết nối dữ liệu đang gặp sự cố. Vui lòng thử lại; nếu lỗi tiếp diễn, liên hệ đầu mối hỗ trợ QTS."
      reset={reset}
    />
  )
}
